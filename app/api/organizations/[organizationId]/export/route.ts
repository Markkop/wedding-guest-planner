import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { AuthService } from '@/lib/auth/auth-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName || undefined,
      profileImageUrl: user.profileImageUrl || undefined
    });

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
      return NextResponse.json({ error: 'Only admins can export data' }, { status: 403 });
    }

    // Get organization data
    const organizationResult = await sql`
      SELECT id, name, invite_code, event_type, configuration, created_at, updated_at
      FROM organizations
      WHERE id = ${organizationId}
    `;

    if (organizationResult.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = organizationResult[0];

    // Get all guests
    const guests = await sql`
      SELECT id, name, categories, age_group, food_preference, confirmation_stage, 
             custom_fields, display_order, created_at, updated_at
      FROM guests
      WHERE organization_id = ${organizationId}
      ORDER BY display_order ASC
    `;

    // Get organization members (excluding sensitive data)
    const members = await sql`
      SELECT om.role, om.joined_at, u.email, u.name
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ${organizationId}
      ORDER BY om.joined_at ASC
    `;

    // Create compact export data structure
    const exportData = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      organization: {
        name: organization.name,
        event_type: organization.event_type,
        configuration: organization.configuration,
        created_at: organization.created_at,
      },
      guests: guests.map(guest => ({
        name: guest.name,
        categories: guest.categories,
        age_group: guest.age_group,
        food_preference: guest.food_preference,
        confirmation_stage: guest.confirmation_stage,
        custom_fields: guest.custom_fields,
        display_order: guest.display_order,
      })),
      members: members.map(member => ({
        email: member.email,
        name: member.name,
        role: member.role,
        joined_at: member.joined_at,
      })),
      invite_code: organization.invite_code,
    };

    return NextResponse.json({ data: exportData });
  } catch (error) {
    console.error('Export error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}