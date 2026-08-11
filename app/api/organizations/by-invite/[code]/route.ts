import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: inviteCode } = await params;

    // Find organization by invite code
    const organizations = await query(
      'SELECT id, name, invite_code, admin_id, event_type, configuration, created_at, updated_at FROM organizations WHERE invite_code = $1',
      [inviteCode]
    );

    if (organizations.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = organizations[0];

    return NextResponse.json({ organization });

  } catch (error) {
    console.error('Error finding organization by invite code:', error);
    return NextResponse.json(
      { error: 'Failed to find organization' },
      { status: 500 }
    );
  }
}
