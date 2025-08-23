import { streamText, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { OrganizationService } from '@/lib/services/organization-service';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { EventConfiguration, Guest } from '@/lib/types';
import type { UIMessage } from 'ai';

// Schema for guest data
const guestSchema = z.object({
  name: z.string().describe('The name of the guest'),
  categories: z.array(z.string()).optional().describe('Array of category IDs for the guest. ALWAYS provide at least one category ID when creating a guest.'),
  age_group: z.string().optional().describe('The age group ID of the guest. Provide if age groups are enabled.'),
  food_preference: z.string().optional().describe('The food preference ID of the guest. Provide if food preferences are enabled.'),
  food_preferences: z.array(z.string()).optional().describe('Array of food preference IDs. Provide if food preferences allow multiple selections.'),
  confirmation_stage: z.string().optional().describe('The confirmation stage ID. ALWAYS provide this when creating a guest.'),
});

// Schema for bulk guest creation
const bulkGuestSchema = z.object({
  guests: z.array(guestSchema).describe('Array of guests to create'),
});

// Schema for guest update
const updateGuestSchema = z.object({
  guestId: z.string().describe('The ID of the guest to update'),
  updates: guestSchema.partial().describe('Fields to update on the guest'),
});

// Schema for guest deletion
const deleteGuestSchema = z.object({
  guestId: z.string().describe('The ID of the guest to delete'),
});

// Schema for getting organization info
const getOrgInfoSchema = z.object({
  organizationId: z.string().describe('The organization ID to get information about'),
});

// Schema for finding a guest by name
const findGuestSchema = z.object({
  name: z.string().describe('The name of the guest to find (can be partial match)'),
});

async function analyzeImage(imageData: string): Promise<string> {
  try {
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract guest information from this image. List all the names you can find, along with any other relevant details like categories, food preferences, or confirmation status. Format it as a list.',
            },
            {
              type: 'image',
              image: imageData,
            },
          ],
        },
      ],
    });

    return response.text || '';
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error('Failed to analyze image');
  }
}

export async function POST(request: Request) {
  try {
    await safeRequireUser();
    
    // Standard JSON request from useChat
    const body = await request.json();
    const organizationId = body.organizationId;
    const messages = body.messages || [];

    // Get organization configuration for context
    const organization = await OrganizationService.getOrganization(organizationId);
    const config = organization.configuration as EventConfiguration;

    // Get current guests for better AI context
    const currentGuests = await GuestService.getGuests(organizationId);

    // Process messages to handle audio and images
    const processedMessages = await Promise.all(messages.map(async (message: UIMessage) => {
      // Handle UIMessage structure with parts
      if (message.parts && Array.isArray(message.parts)) {
        const textParts = message.parts.filter((part) => part.type === 'text');
        if (textParts.length > 0) {
          const textContent = textParts.map((part) => (part as { text: string }).text).join('');
          
          // Audio transcription is now handled separately via /api/transcribe
          // No need to process audio markers here anymore

          // Check for image data
          if (textContent.includes('data:image/')) {
            const imageMatch = textContent.match(/(data:image\/[^;]+;base64,[^\s]+)/);
            if (imageMatch) {
              const imageData = imageMatch[1];
              const imageAnalysis = await analyzeImage(imageData);
              return {
                role: message.role,
                content: textContent.replace(imageData, `[Image analyzed: ${imageAnalysis}]`),
              };
            }
          }

          // Return message with content format for streamText
          return {
            role: message.role,
            content: textContent,
          };
        }
      }
      
      // Fallback for older format or if no text parts
      return {
        role: message.role,
        content: '',
      };
    }));

    // Helper function to format guest list for context
    const formatGuestContext = (guests: Guest[]) => {
      if (guests.length === 0) {
        return 'No guests have been added yet.';
      }
      
      return guests.map(guest => {
        const categoryLabels = guest.categories?.map((catId: string) => 
          config.categories.find(c => c.id === catId)?.label || catId
        ).join(', ') || 'None';
        
        const ageGroupLabel = guest.age_group 
          ? config.ageGroups.groups.find(g => g.id === guest.age_group)?.label || guest.age_group
          : 'Not set';
          
        const foodPrefLabel = guest.food_preference
          ? config.foodPreferences.options.find(f => f.id === guest.food_preference)?.label || guest.food_preference
          : 'Not set';
          
        const confirmationLabel = config.confirmationStages.stages.find(s => s.id === guest.confirmation_stage)?.label || guest.confirmation_stage;
        
        return `• ${guest.name} (ID: ${guest.id}) - ${categoryLabels} | ${confirmationLabel}${config.ageGroups.enabled ? ` | Age: ${ageGroupLabel}` : ''}${config.foodPreferences.enabled ? ` | Food: ${foodPrefLabel}` : ''}`;
      }).join('\n');
    };

      const systemPrompt = `You are a helpful assistant for a wedding guest planning application. 
    
Current organization configuration:
- Event Type: ${organization.event_type}
- Categories: ${config.categories.map(c => `${c.label} (${c.id})`).join(', ')}
- Age Groups: ${config.ageGroups.enabled ? config.ageGroups.groups.map(g => `${g.label} (${g.id})`).join(', ') : 'Not enabled'}
- Food Preferences: ${config.foodPreferences.enabled ? config.foodPreferences.options.map(f => `${f.label} (${f.id})`).join(', ') : 'Not enabled'}
- Confirmation Stages: ${config.confirmationStages.enabled ? config.confirmationStages.stages.map(s => `${s.label} (${s.id})`).join(', ') : 'Not enabled'}

CURRENT GUEST LIST (${currentGuests.length} guests):
${formatGuestContext(currentGuests)}

When working with guests:
- You can reference guests by their name or ID when editing/deleting
- Always use the ID values (not labels) for categories, age groups, food preferences, and confirmation stages

MANDATORY WHEN CREATING GUESTS:
- **ALWAYS** provide categories array with at least one category ID: ["${config.categories[0]?.id}"]
- **ALWAYS** provide confirmation_stage: "${config.confirmationStages.stages[0]?.id || 'invited'}"
${config.ageGroups.enabled ? `- **ALWAYS** provide age_group when age groups are enabled: "${config.ageGroups.groups[0]?.id}"` : '- age_group: Not needed (age groups disabled)'}
${config.foodPreferences.enabled ? `- **ALWAYS** provide food_preference when food preferences are enabled: "${config.foodPreferences.options[0]?.id}"` : '- food_preference: Not needed (food preferences disabled)'}

NEVER create a guest without providing these required fields in your tool calls!

CRITICAL RESPONSE GUIDELINES:
1. **ALWAYS provide a conversational text response** before, during, or after using any tools
2. **Explain what you're doing** when using tools (e.g., "I'll add John to your guest list" or "Let me update Sarah's information")
3. **Acknowledge the user's request** and provide feedback on the results
4. **If editing/deleting guests**, reference them by name and explain what changes you're making
5. **If creating guests**, confirm what information you're adding and any defaults you're using
6. **Never use tools without explaining your actions in natural language**

Be helpful, conversational, and informative. When users provide lists of names or images with guest information, help them create guests efficiently while explaining each step.`;

    console.log("Processed messages for AI:", processedMessages);
    
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: processedMessages,

      tools: {
        createGuest: {
          description: 'Create a single guest. ALWAYS provide categories array and confirmation_stage. Include age_group and food_preference if those features are enabled.',
          inputSchema: guestSchema,
          execute: async (guest) => {
            try {
              const newGuest = await GuestService.createGuest(organizationId, guest);
              return { success: true, guest: newGuest };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to create guest' };
            }
          },
        },
        createMultipleGuests: {
          description: 'Create multiple guests at once. For each guest, ALWAYS provide categories array and confirmation_stage. Include age_group and food_preference if those features are enabled.',
          inputSchema: bulkGuestSchema,
          execute: async ({ guests }) => {
            const results = [];
            for (const guest of guests) {
              try {
                const newGuest = await GuestService.createGuest(organizationId, guest);
                results.push({ success: true, guest: newGuest });
              } catch (error) {
                results.push({
                  success: false,
                  guestName: guest.name,
                  error: error instanceof Error ? error.message : 'Failed to create guest'
                });
              }
            }
            return { results };
          },
        },
        updateGuest: {
          description: 'Update an existing guest',
          inputSchema: updateGuestSchema,
          execute: async ({ guestId, updates }) => {
            try {
              const updatedGuest = await GuestService.updateGuest(guestId, updates);
              return { success: true, guest: updatedGuest };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to update guest' };
            }
          },
        },
        deleteGuest: {
          description: 'Delete a guest',
          inputSchema: deleteGuestSchema,
          execute: async ({ guestId }) => {
            try {
              await GuestService.deleteGuest(guestId);
              return { success: true };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to delete guest' };
            }
          },
        },
        getGuests: {
          description: 'Get the list of all guests',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const guests = await GuestService.getGuests(organizationId);
              return { success: true, guests };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to get guests' };
            }
          },
        },
        getOrganizationInfo: {
          description: 'Get information about the organization configuration',
          inputSchema: getOrgInfoSchema,
          execute: async ({ organizationId }) => {
            try {
              const org = await OrganizationService.getOrganization(organizationId);
              return { success: true, organization: org };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to get organization' };
            }
          },
        },
        findGuest: {
          description: 'Find a guest by name (useful when user refers to a guest by name for editing or deleting)',
          inputSchema: findGuestSchema,
          execute: async ({ name }) => {
            try {
              const guests = await GuestService.getGuests(organizationId);
              const matchingGuests = guests.filter(guest => 
                guest.name.toLowerCase().includes(name.toLowerCase())
              );
              return { success: true, guests: matchingGuests };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to find guest' };
            }
          },
        },
      },
    });

    console.log("Returning streaming result");
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
