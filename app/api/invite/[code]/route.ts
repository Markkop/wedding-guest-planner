import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: inviteCode } = await params;

    // Get organization by invite code
    const organizations = await query<{
      id: string;
      name: string;
      admin_id: string;
      event_type: string | null;
    }>(
      'SELECT id, name, invite_code, admin_id, event_type FROM organizations WHERE invite_code = $1',
      [inviteCode]
    );
    
    if (organizations.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
    }

    const organization = organizations[0];

    // Check if user is authenticated and already a member
    let alreadyMember = false;
    try {
      const authResult = await AuthService.getCurrentUser();
      if (authResult.userId) {
        const members = await query(
          'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
          [organization.id, authResult.userId]
        );
        alreadyMember = members.length > 0;
      }
    } catch {
      // User not authenticated, continue
    }

    // Get admin info and member count
    const [admins, memberCounts] = await Promise.all([
      query<{ name: string | null; email: string }>('SELECT name, email FROM users WHERE id = $1', [organization.admin_id]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1', [organization.id])
    ]);

    const admin = admins[0];
    const memberCount = parseInt(memberCounts[0].count);

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        event_type: organization.event_type || 'custom',
        admin_name: admin?.name || admin?.email || 'Unknown',
        member_count: memberCount,
      },
      alreadyMember,
    });

  } catch (error) {
    console.error('Error loading invite:', error);
    return NextResponse.json(
      { error: 'Failed to load invite information' },
      { status: 500 }
    );
  }
}
