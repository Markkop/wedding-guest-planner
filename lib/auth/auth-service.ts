import { safeGetUser, safeRequireUser } from '@/lib/auth/safe-stack';
import { sql } from '@/lib/db';

export class AuthService {
  static async getCurrentUser() {
    return await safeGetUser();
  }

  static async requireUser() {
    return await safeRequireUser();
  }

  static async syncUserToDatabase(stackUser: { id: string; primaryEmail: string; displayName?: string; profileImageUrl?: string }) {
    // Sync Stack Auth user to our local database if needed
    const result = await sql`
      INSERT INTO users (id, email, name, avatar_url)
      VALUES (${stackUser.id}, ${stackUser.primaryEmail}, ${stackUser.displayName}, ${stackUser.profileImageUrl})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = CURRENT_TIMESTAMP
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