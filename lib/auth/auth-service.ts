import { headers } from "next/headers";
import { auth, type AuthUser } from "@/lib/auth/auth";
import { sql } from "@/lib/db";

export class AuthService {
  private static async getSession() {
    return auth.api.getSession({ headers: await headers() });
  }

  static async getCurrentUser() {
    const session = await this.getSession();
    return { userId: session?.user.id ?? null };
  }

  static async requireUser() {
    const session = await this.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }
    return { userId: session.user.id };
  }

  static async getCurrentUserFull(): Promise<AuthUser | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  static async requireUserFull(): Promise<AuthUser> {
    const session = await this.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }
    return session.user;
  }

  static async getUserByEmail(email: string) {
    const result = await sql`
      SELECT id, email, name, avatar_url, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;
    return result[0] || null;
  }

  static async getUserByAnyEmail(emails: string[]) {
    for (const email of emails) {
      const user = await this.getUserByEmail(email);
      if (user) return user;
    }
    return null;
  }

  static async getEffectiveUserId(userId: string | null, emails: string[]) {
    if (userId) {
      const userById = await sql`SELECT id FROM users WHERE id = ${userId} LIMIT 1`;
      if (userById[0]) return userId;
    }

    const userByEmail = await this.getUserByAnyEmail(emails);
    return (userByEmail?.id as string | undefined) ?? null;
  }

  static async updateUser(
    userId: string,
    data: { name?: string; avatar_url?: string },
  ) {
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
