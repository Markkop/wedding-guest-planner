import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export class AuthService {
  static async getCurrentUser() {
    return await auth();
  }

  static async requireUser() {
    const authResult = await auth();
    if (!authResult.userId) {
      throw new Error('Authentication required');
    }
    return authResult;
  }

  static async getCurrentUserFull() {
    return await currentUser();
  }

  static async requireUserFull() {
    const user = await currentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }

  /**
   * Find user by email address (case-insensitive)
   * Returns first match found
   */
  static async getUserByEmail(email: string) {
    const result = await sql`
      SELECT id, email, name, avatar_url, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;
    return result[0] || null;
  }

  /**
   * Find user by any of the provided email addresses
   * Returns first match found
   */
  static async getUserByAnyEmail(emails: string[]) {
    if (emails.length === 0) return null;

    // Check each email until we find a match
    for (const email of emails) {
      const user = await this.getUserByEmail(email);
      if (user) return user;
    }
    return null;
  }

  /**
   * Get effective user ID - tries Clerk ID first, falls back to email lookup
   * Returns user ID or null if not found
   */
  static async getEffectiveUserId(clerkUserId: string | null, emails: string[]): Promise<string | null> {
    // Try ID-based lookup first (backward compatibility)
    if (clerkUserId) {
      const userById = await sql`
        SELECT id FROM users WHERE id = ${clerkUserId} LIMIT 1
      `;
      if (userById[0]) {
        return clerkUserId;
      }
    }

    // Fall back to email-based lookup
    const userByEmail = await this.getUserByAnyEmail(emails);
    return userByEmail?.id || null;
  }

  /**
   * Migrate all foreign key references from old user ID to new user ID
   * Updates: organizations.admin_id, organization_members.user_id, guests.created_by, active_sessions.user_id
   */
  static async migrateUserIds(oldUserId: string, newUserId: string) {
    try {
      // Update organizations.admin_id
      await sql`
        UPDATE organizations
        SET admin_id = ${newUserId}
        WHERE admin_id = ${oldUserId}
      `;

      // Update organization_members.user_id
      await sql`
        UPDATE organization_members
        SET user_id = ${newUserId}
        WHERE user_id = ${oldUserId}
      `;

      // Update guests.created_by
      await sql`
        UPDATE guests
        SET created_by = ${newUserId}
        WHERE created_by = ${oldUserId}
      `;

      // Update active_sessions.user_id
      await sql`
        UPDATE active_sessions
        SET user_id = ${newUserId}
        WHERE user_id = ${oldUserId}
      `;

      // Delete the old user record (after migrating all references)
      await sql`
        DELETE FROM users
        WHERE id = ${oldUserId}
      `;
    } catch (error) {
      console.error('Error migrating user IDs:', error);
      throw error;
    }
  }

  static async syncUserToDatabase(clerkUser: { id: string; emailAddresses: Array<{ emailAddress: string }>; firstName?: string | null; lastName?: string | null; imageUrl?: string }) {
    // Sync Clerk user to our local database if needed
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name = clerkUser.firstName || clerkUser.lastName 
      ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
      : null;
    const avatarUrl = clerkUser.imageUrl || null;

    // Step 1: Check if user exists by Clerk ID (for backward compatibility)
    const existingById = await sql`
      SELECT id, email, name, avatar_url, created_at, updated_at
      FROM users
      WHERE id = ${clerkUser.id}
      LIMIT 1
    `;

    if (existingById[0]) {
      // User exists with this ID, just update the fields
      const result = await sql`
        UPDATE users
        SET email = ${email},
            name = ${name},
            avatar_url = ${avatarUrl},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${clerkUser.id}
        RETURNING id, email, name, avatar_url, created_at, updated_at
      `;
      return result[0];
    }

    // Step 2: Check if user exists by email (any email in emailAddresses array)
    const emails = clerkUser.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const existingByEmail = await this.getUserByAnyEmail(emails);

    if (existingByEmail) {
      // User exists with different ID - migrate all FK references
      if (existingByEmail.id !== clerkUser.id) {
        // Migrate all FK references and delete old user
        await this.migrateUserIds(existingByEmail.id, clerkUser.id);
        // After migration, create new user record with Clerk ID
        // Try INSERT first, handle conflicts if they occur
        try {
          const result = await sql`
            INSERT INTO users (id, email, name, avatar_url, password_hash)
            VALUES (${clerkUser.id}, ${email}, ${name}, ${avatarUrl}, 'clerk_managed')
            RETURNING id, email, name, avatar_url, created_at, updated_at
          `;
          return result[0];
        } catch (insertError: any) {
          // If email conflict, the old user still exists (migration might have failed)
          // Check if it's the same user we just migrated from
          if (insertError?.code === '23505' && insertError?.constraint === 'users_email_key') {
            // Old user still exists - migration might have failed
            // Just return the existing user (migration will happen on next sync)
            const existingUser = await this.getUserByEmail(email);
            if (existingUser) {
              return existingUser;
            }
          }
          // If ID conflict, user already exists with this ID, just update
          if (insertError?.code === '23505') {
            const result = await sql`
              UPDATE users
              SET email = ${email},
                  name = ${name},
                  avatar_url = ${avatarUrl},
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${clerkUser.id}
              RETURNING id, email, name, avatar_url, created_at, updated_at
            `;
            return result[0];
          }
          throw insertError;
        }
      } else {
        // Same ID, just update the user info
        const result = await sql`
          UPDATE users
          SET email = ${email},
              name = ${name},
              avatar_url = ${avatarUrl},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${clerkUser.id}
          RETURNING id, email, name, avatar_url, created_at, updated_at
        `;
        return result[0];
      }
    }

    // Step 3: User doesn't exist, create new user record
    const result = await sql`
      INSERT INTO users (id, email, name, avatar_url, password_hash)
      VALUES (${clerkUser.id}, ${email}, ${name}, ${avatarUrl}, 'clerk_managed')
      RETURNING id, email, name, avatar_url, created_at, updated_at
    `;

    return result[0];
  }

  static async updateUser(userId: string, data: { name?: string; avatar_url?: string }) {
    const result = await sql`
      UPDATE users
      SET name = COALESCE(${data.name}, name),
          avatar_url = COALESCE(${data.avatar_url}, avatar_url)
      WHERE id = ${userId}
      RETURNING id, email, name, avatar_url, created_at, updated_at
    `;

    return result[0];
  }
}