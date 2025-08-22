import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { Client } from 'pg';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  let client: Client | null = null;
  
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Check if user is already a member
    const memberCheck = await client.query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [organization.id, user.id]
    );
    
    if (memberCheck.rows.length > 0) {
      return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 400 });
    }

    // Add user to organization
    await client.query(
      'INSERT INTO organization_members (organization_id, user_id, role, joined_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [organization.id, user.id, 'member']
    );

    return NextResponse.json({ 
      message: 'Successfully joined organization',
      organizationId: organization.id,
      organizationName: organization.name,
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Failed to join organization' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}