import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const clerkUserId = clerkUser.id;
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const oldUserId = 'c3b4c31a-8bb9-4bc5-bcbd-4ef00560fd4f';

    // Verify this is the right user
    if (email !== 'marcelokopmann@gmail.com') {
      return NextResponse.json({ 
        error: 'This migration is only for marcelokopmann@gmail.com',
        yourEmail: email 
      }, { status: 400 });
    }

    // Pre-migration check
    const preCheck = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE admin_id = ${oldUserId}) as orgs_with_old_id,
        (SELECT COUNT(*) FROM organization_members WHERE user_id = ${oldUserId}) as members_with_old_id,
        (SELECT COUNT(*) FROM guests WHERE created_by = ${oldUserId}) as guests_with_old_id
      FROM organizations
    `;

    const preMigration = preCheck[0];

    // Execute migration in transaction
    await sql.begin(async (sql) => {
      // Update organizations.admin_id
      await sql`
        UPDATE organizations
        SET admin_id = ${clerkUserId}
        WHERE admin_id = ${oldUserId}
      `;

      // Update organization_members.user_id
      await sql`
        UPDATE organization_members
        SET user_id = ${clerkUserId}
        WHERE user_id = ${oldUserId}
      `;

      // Update guests.created_by
      await sql`
        UPDATE guests
        SET created_by = ${clerkUserId}
        WHERE created_by = ${oldUserId}
      `;

      // Update active_sessions.user_id (if any)
      await sql`
        UPDATE active_sessions
        SET user_id = ${clerkUserId}
        WHERE user_id = ${oldUserId}
      `;

      // Create/update user record with Clerk ID
      await sql`
        INSERT INTO users (id, email, name, avatar_url, password_hash)
        VALUES (
          ${clerkUserId},
          ${email},
          (SELECT name FROM users WHERE id = ${oldUserId}),
          (SELECT avatar_url FROM users WHERE id = ${oldUserId}),
          'clerk_managed'
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = COALESCE(EXCLUDED.name, users.name),
          avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
          updated_at = CURRENT_TIMESTAMP
      `;

      // Delete old user record (only after all FK references are updated)
      await sql`
        DELETE FROM users
        WHERE id = ${oldUserId}
      `;
    });

    // Post-migration verification
    const postCheck = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE admin_id = ${clerkUserId}) as orgs_with_new_id,
        (SELECT COUNT(*) FROM organization_members WHERE user_id = ${clerkUserId}) as members_with_new_id,
        (SELECT COUNT(*) FROM guests WHERE created_by = ${clerkUserId}) as guests_with_new_id,
        (SELECT COUNT(*) FROM users WHERE id = ${oldUserId}) as old_user_exists
      FROM organizations
    `;

    const postMigration = postCheck[0];

    return NextResponse.json({
      success: true,
      clerkUserId,
      email,
      preMigration: {
        orgs: Number(preMigration.orgs_with_old_id),
        members: Number(preMigration.members_with_old_id),
        guests: Number(preMigration.guests_with_old_id)
      },
      postMigration: {
        orgs: Number(postMigration.orgs_with_new_id),
        members: Number(postMigration.members_with_new_id),
        guests: Number(postMigration.guests_with_new_id),
        oldUserExists: Number(postMigration.old_user_exists) === 0
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

