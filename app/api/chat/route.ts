import { streamText, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { OrganizationService } from '@/lib/services/organization-service';
import { safeRequireUser, getStackServerApp } from '@/lib/auth/safe-stack';
import { EventConfiguration, Guest } from '@/lib/types';
import type { UIMessage } from 'ai';
import { broadcastToOrganization } from '@/app/api/organizations/[organizationId]/stream/route';

// Schema for guest data
const guestSchema = z.object({
  name: z.string().describe('The name of the guest'),
  categories: z.array(z.string()).optional().describe('Array of category IDs for the guest. ALWAYS provide at least one category ID when creating a guest.'),
  age_group: z.string().optional().describe('The age group ID of the guest. Provide if age groups are enabled.'),
  food_preference: z.string().optional().describe('The food preference ID of the guest. Provide if food preferences are enabled.'),
  food_preferences: z.array(z.string()).optional().describe('Array of food preference IDs. Provide if food preferences allow multiple selections.'),
  confirmation_stage: z.string().optional().describe('The confirmation stage ID. ALWAYS provide this when creating a guest.'),
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
    // Validate image data format
    if (!imageData || !imageData.startsWith('data:image/')) {
      throw new Error('Invalid image data format');
    }

    // Check image size (base64 data should be reasonable)
    if (imageData.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image too large');
    }

    console.log('Analyzing image, data length:', imageData.length);
    console.log('Image data prefix:', imageData.substring(0, 50) + '...');

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

    console.log('Image analysis successful');
    return response.text || 'No guest information found in the image.';
  } catch (error) {
    console.error('Image analysis error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      imageDataLength: imageData?.length || 0,
      imagePrefix: imageData?.substring(0, 50) || 'No image data'
    });
    
    // Return a graceful fallback instead of throwing
    return 'I was unable to analyze this image. Please try with a different image or describe the guest information manually.';
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
            // More flexible regex to capture complete base64 data URLs
            const imageMatch = textContent.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g);
            if (imageMatch && imageMatch.length > 0) {
              console.log(`Found ${imageMatch.length} image(s) in message`);
              
              let processedContent = textContent;
              
              // Process each image found
              for (const imageData of imageMatch) {
                try {
                  console.log(`Processing image, length: ${imageData.length}`);
                  const imageAnalysis = await analyzeImage(imageData);
                  processedContent = processedContent.replace(imageData, `[Image analyzed: ${imageAnalysis}]`);
                } catch (error) {
                  console.error('Failed to process image:', error);
                  processedContent = processedContent.replace(imageData, '[Image could not be processed]');
                }
              }
              
              return {
                role: message.role,
                content: processedContent,
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

CRITICAL CONTEXT UNDERSTANDING:
- The conversation history shows COMPLETED actions - they have ALREADY been executed successfully
- Tool results in previous messages represent FINISHED operations - do NOT repeat them
- ONLY focus on the user's LATEST message and what they are asking for RIGHT NOW
- If you see previous successful tool calls (like "Adding Pedro"), those guests have ALREADY been created
- Never re-execute or duplicate actions that appear in conversation history

IMPORTANT: Only respond to the user's CURRENT request. Never re-execute actions from previous messages in the conversation history.

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
- **When working with multiple guests at the same time**, use multiple individual tool calls to attend to the user's request (e.g., if user asks to add 3 guests, make 3 separate createGuest calls)
- **For multiple operations**, explain what you're doing and process each guest individually with separate tool calls

MANDATORY when CREATING GUESTS:
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

CRITICAL: NEVER RE-EXECUTE PREVIOUS TOOL CALLS
- **ONLY respond to the user's CURRENT request** - do not repeat or re-execute actions from earlier in the conversation
- **If you see tool results in the conversation history**, those actions have ALREADY been completed - do not repeat them
- **Focus solely on the user's latest message** and what they are asking for right now
- **Previous successful tool calls are COMPLETED ACTIONS** - seeing "Adding Pedro" in history means Pedro was ALREADY added
- **Example**: If conversation shows you previously added guests A and B, and user now says "remove B", ONLY remove B - do not re-add A and B first
- **Example**: If user says "add pedro" and you see "Adding Pedro" already in conversation history, Pedro is ALREADY ADDED - do not add him again

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
              
              // Broadcast the change to other connected users
              const user = await getStackServerApp().getUser();
              if (user) {
                await broadcastToOrganization(organizationId, {
                  type: "guest_added",
                  userId: user.id,
                  userName: user.displayName || user.primaryEmail || "AI Assistant",
                  guest: newGuest,
                  timestamp: new Date().toISOString(),
                  isAI: true,
                });
              }
              
              return { success: true, guest: newGuest };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to create guest' };
            }
          },
        },
        updateGuest: {
          description: 'Update an existing guest',
          inputSchema: updateGuestSchema,
          execute: async ({ guestId, updates }) => {
            try {
              // Get guest info before updating for broadcast
              const guests = await GuestService.getGuests(organizationId);
              const existingGuest = guests.find(g => g.id === guestId);
              
              const updatedGuest = await GuestService.updateGuest(guestId, updates);
              
              // Broadcast the change to other connected users
              const user = await getStackServerApp().getUser();
              if (user) {
                await broadcastToOrganization(organizationId, {
                  type: "guest_updated",
                  userId: user.id,
                  userName: user.displayName || user.primaryEmail || "AI Assistant",
                  guestId,
                  guestName: existingGuest?.name || "Unknown",
                  updates,
                  updatedFields: Object.keys(updates),
                  timestamp: new Date().toISOString(),
                  isAI: true,
                });
              }
              
              return { success: true, guest: updatedGuest, guestName: existingGuest?.name, updatedFields: Object.keys(updates) };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to update guest' };
            }
          },
        },
        deleteGuest: {
          description: 'Delete a guest',
          inputSchema: deleteGuestSchema,
          execute: async ({ guestId }) => {
            console.log("🤖 AI deleteGuest tool called with guestId:", guestId);
            try {
              // Get guest info before deleting for broadcast
              const guests = await GuestService.getGuests(organizationId);
              const existingGuest = guests.find(g => g.id === guestId);
              
              console.log("🤖 AI calling GuestService.deleteGuest");
              await GuestService.deleteGuest(guestId);
              console.log("🤖 AI GuestService.deleteGuest completed successfully");
              
              // Broadcast the change to other connected users
              const user = await getStackServerApp().getUser();
              console.log("🤖 AI got user for broadcast:", user?.id);
              if (user) {
                console.log("🤖 AI broadcasting guest deletion:", guestId);
                await broadcastToOrganization(organizationId, {
                  type: "guest_deleted",
                  userId: user.id,
                  userName: user.displayName || user.primaryEmail || "AI Assistant",
                  guestId,
                  guestName: existingGuest?.name || "Unknown",
                  timestamp: new Date().toISOString(),
                  isAI: true,
                });
                console.log("🤖 AI broadcast completed");
              }
              
              return { success: true, guestName: existingGuest?.name };
            } catch (error) {
              console.error("🤖 AI deleteGuest error:", error);
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
