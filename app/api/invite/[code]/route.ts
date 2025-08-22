import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { Client } from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  let client: Client | null = null;
  
  try {
    const { code: inviteCode } = await params;
    
    // Connect to database
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();

    // Get organization by invite code
    const orgResult = await client.query(
      'SELECT id, name, invite_code, admin_id, event_type FROM organizations WHERE invite_code = $1',
      [inviteCode]
    );
    
    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
    }

    const organization = orgResult.rows[0];

    // Check if user is authenticated and already a member
    let alreadyMember = false;
    try {
      const user = await stackServerApp.getUser();
      if (user) {
        const memberResult = await client.query(
          'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
          [organization.id, user.id]
        );
        alreadyMember = memberResult.rows.length > 0;
      }
    } catch {
      // User not authenticated, continue
    }

    // Get admin info and member count
    const [adminResult, memberCountResult] = await Promise.all([
      client.query('SELECT name, email FROM users WHERE id = $1', [organization.admin_id]),
      client.query('SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1', [organization.id])
    ]);

    const admin = adminResult.rows[0];
    const memberCount = parseInt(memberCountResult.rows[0].count);

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
  } finally {
    if (client) {
      await client.end();
    }
  }
}