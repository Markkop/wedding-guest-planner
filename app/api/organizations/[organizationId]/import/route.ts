import { NextResponse } from 'next/server';
import { queryWithClient, sql, withTransaction } from '@/lib/db';
import { AuthService } from '@/lib/auth/auth-service';
import { z } from 'zod';

// Validation schema for import data
const importDataSchema = z.object({
  version: z.string(),
  exported_at: z.string(),
  organization: z.object({
    name: z.string().min(1),
    event_type: z.string(),
    configuration: z.record(z.unknown()),
    created_at: z.string().optional(),
  }),
  guests: z.array(z.object({
    name: z.string().min(1),
    categories: z.array(z.string()).optional().default([]),
    age_group: z.string().optional(),
    food_preference: z.string().optional(),
    confirmation_stage: z.string().optional().default('invited'),
    custom_fields: z.record(z.unknown()).optional().default({}),
    display_order: z.number().optional(),
  })),
  members: z.array(z.object({
    email: z.string().email(),
    name: z.string().nullable().optional(),
    role: z.enum(['admin', 'member']),
    joined_at: z.string().optional(),
  })).optional().default([]),
  invite_code: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const user = await AuthService.requireUserFull();

    // Check if user has access to this organization
    const memberCheck = await sql`
      SELECT role FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow admins to export/import data
    if (memberCheck[0].role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can import data' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate the import data
    const validatedData = importDataSchema.parse(body.data);

    await withTransaction(async (client) => {
      // Update organization settings
      await queryWithClient(
        client,
        `UPDATE organizations
         SET name = $1, event_type = $2, configuration = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          validatedData.organization.name,
          validatedData.organization.event_type,
          JSON.stringify(validatedData.organization.configuration),
          organizationId,
        ],
      );

      // Clear existing guests
      await queryWithClient(
        client,
        'DELETE FROM guests WHERE organization_id = $1',
        [organizationId],
      );

      // Import guests
      for (const [index, guest] of validatedData.guests.entries()) {
        const displayOrder = guest.display_order ?? (index + 1);
        
        await queryWithClient(
          client,
          `INSERT INTO guests (
             organization_id, name, categories, age_group,
             food_preference, confirmation_stage, custom_fields,
             display_order, created_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            organizationId,
            guest.name,
            guest.categories,
            guest.age_group || null,
            guest.food_preference || null,
            guest.confirmation_stage,
            JSON.stringify(guest.custom_fields ?? {}),
            displayOrder,
            user.id,
          ],
        );
      }

      // Update invite code if provided
      if (validatedData.invite_code) {
        // Check if the invite code already exists for another organization
        const existingInviteCode = await queryWithClient(
          client,
          'SELECT id FROM organizations WHERE invite_code = $1 AND id != $2',
          [validatedData.invite_code, organizationId],
        );
        
        if (existingInviteCode.length === 0) {
          // Only update if the invite code is not used by another organization
          await queryWithClient(
            client,
            'UPDATE organizations SET invite_code = $1 WHERE id = $2',
            [validatedData.invite_code, organizationId],
          );
        } else {
          // Generate a new unique invite code if there's a conflict
          const { nanoid } = await import('nanoid');
          let newInviteCode;
          let attempts = 0;
          
          do {
            newInviteCode = nanoid(8).toUpperCase();
            const existing = await queryWithClient(
              client,
              'SELECT id FROM organizations WHERE invite_code = $1',
              [newInviteCode],
            );
            if (existing.length === 0) break;
            attempts++;
          } while (attempts < 10);
          
          if (newInviteCode) {
            await queryWithClient(
              client,
              'UPDATE organizations SET invite_code = $1 WHERE id = $2',
              [newInviteCode, organizationId],
            );
          }
        }
      }

    });

    // Return summary of imported data
    const summary = {
      organization_updated: true,
      guests_imported: validatedData.guests.length,
      members_info: validatedData.members.length,
      invite_code_updated: !!validatedData.invite_code,
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Data imported successfully',
      summary
    });

  } catch (error) {
    console.error('Import error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid import data format', 
        details: error.issues 
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ 
          error: 'Import failed due to duplicate data. Please check your import file.' 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
