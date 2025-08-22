import { streamText, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { OrganizationService } from '@/lib/services/organization-service';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { EventConfiguration } from '@/lib/types';
import type { UIMessage } from 'ai';

// Schema for guest data
const guestSchema = z.object({
  name: z.string().describe('The name of the guest'),
  categories: z.array(z.string()).optional().describe('Array of category IDs for the guest'),
  age_group: z.string().optional().describe('The age group ID of the guest'),
  food_preference: z.string().optional().describe('The food preference ID of the guest'),
  food_preferences: z.array(z.string()).optional().describe('Array of food preference IDs'),
  confirmation_stage: z.string().optional().describe('The confirmation stage ID (invited, confirmed, declined, etc)'),
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

async function transcribeAudio(audioData: Buffer | ArrayBuffer): Promise<string> {
  try {
    const formData = new FormData();
    const uint8Array = audioData instanceof Buffer ? new Uint8Array(audioData) : new Uint8Array(audioData);
    const audioBlob = new Blob([uint8Array], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Audio transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

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

    // Process messages to handle audio and images
    const processedMessages = await Promise.all(messages.map(async (message: UIMessage) => {
      // Handle UIMessage structure with parts
      if (message.parts && Array.isArray(message.parts)) {
        const textParts = message.parts.filter((part) => part.type === 'text');
        if (textParts.length > 0) {
          const textContent = textParts.map((part) => (part as { text: string }).text).join('');
          
          // Check for audio recording marker
          if (textContent.includes('[Audio recording - please transcribe]')) {
            const base64Audio = textContent.replace('[Audio recording - please transcribe] ', '');
            const audioBuffer = Buffer.from(base64Audio.split(',')[1], 'base64');
            const transcription = await transcribeAudio(audioBuffer);
            return {
              role: message.role,
              content: `Audio transcription: ${transcription}`,
            };
          }

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

    const systemPrompt = `You are a helpful assistant for a wedding guest planning application. 
    
Current organization configuration:
- Event Type: ${organization.event_type}
- Categories: ${config.categories.map(c => `${c.label} (${c.id})`).join(', ')}
- Age Groups: ${config.ageGroups.enabled ? config.ageGroups.groups.map(g => `${g.label} (${g.id})`).join(', ') : 'Not enabled'}
- Food Preferences: ${config.foodPreferences.enabled ? config.foodPreferences.options.map(f => `${f.label} (${f.id})`).join(', ') : 'Not enabled'}
- Confirmation Stages: ${config.confirmationStages.enabled ? config.confirmationStages.stages.map(s => `${s.label} (${s.id})`).join(', ') : 'Not enabled'}

When creating guests:
- Always use the ID values (not labels) for categories, age groups, food preferences, and confirmation stages
- Default confirmation stage is "${config.confirmationStages.stages[0]?.id || 'invited'}"
- Default category is "${config.categories[0]?.id}"
- If age groups are enabled, default is "${config.ageGroups.groups[0]?.id}"
- If food preferences are enabled, default is "${config.foodPreferences.options[0]?.id}"

Be helpful and conversational. When users provide lists of names or images with guest information, help them create guests efficiently.`;

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: processedMessages,

      tools: {
        createGuest: {
          description: 'Create a single guest',
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
          description: 'Create multiple guests at once',
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
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
