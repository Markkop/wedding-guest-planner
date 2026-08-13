import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const authResult = await AuthService.requireUser();

    const { organizationId } = await params;

    // Check if user is admin of this organization
    const members = await query<{ role: string }>(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [organizationId, authResult.userId]
    );

    if (members.length === 0) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    if (members[0].role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can refresh invite codes' }, { status: 403 });
    }

    // Generate new invite code
    const newInviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Update organization with new invite code
    await query(
      'UPDATE organizations SET invite_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newInviteCode, organizationId]
    );

    return NextResponse.json({ 
      inviteCode: newInviteCode,
      message: 'Invite code refreshed successfully' 
    });

  } catch (error) {
    console.error('Error refreshing invite code:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to refresh invite code' },
      { status: 500 }
    );
  }
}
