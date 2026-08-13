import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authResult = await AuthService.requireUser();

    const { code: inviteCode } = await params;

    // Get organization by invite code
    const organizations = await query<{ id: string; name: string }>(
      'SELECT id, name, invite_code, admin_id, event_type FROM organizations WHERE invite_code = $1',
      [inviteCode]
    );

    if (organizations.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
    }

    const organization = organizations[0];

    // Check if user is already a member
    const memberCheck = await query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [organization.id, authResult.userId]
    );
    
    if (memberCheck.length > 0) {
      return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 400 });
    }

    // Add user to organization
    await query(
      'INSERT INTO organization_members (organization_id, user_id, role, joined_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [organization.id, authResult.userId, 'member']
    );

    return NextResponse.json({ 
      message: 'Successfully joined organization',
      organizationId: organization.id,
      organizationName: organization.name,
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to join organization' },
      { status: 500 }
    );
  }
}
