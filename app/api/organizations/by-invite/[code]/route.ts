import { NextRequest, NextResponse } from 'next/server';
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

    // Find organization by invite code
    const result = await client.query(
      'SELECT id, name, invite_code, admin_id, event_type, configuration, created_at, updated_at FROM organizations WHERE invite_code = $1',
      [inviteCode]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = result.rows[0];

    return NextResponse.json({ organization });

  } catch (error) {
    console.error('Error finding organization by invite code:', error);
    return NextResponse.json(
      { error: 'Failed to find organization' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}