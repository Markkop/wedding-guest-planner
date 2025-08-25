import { sql } from '@/lib/db';
import { TierType, shouldResetAiMessages, canUserPerformAction } from '@/lib/tiers';

export interface UserTierInfo {
  id: string;
  tier: TierType;
  aiMessagesUsedToday: number;
  aiMessagesResetAt: Date;
  isSuperAdmin: boolean;
}

export class TierService {
  static async getUserTierInfo(userId: string): Promise<UserTierInfo | null> {
    const [user] = await sql`
      SELECT id, tier, ai_messages_used_today, ai_messages_reset_at, is_super_admin
      FROM users 
      WHERE id = ${userId}
    `;

    if (!user) return null;

    return {
      id: user.id,
      tier: user.tier as TierType,
      aiMessagesUsedToday: user.ai_messages_used_today,
      aiMessagesResetAt: user.ai_messages_reset_at,
      isSuperAdmin: user.is_super_admin,
    };
  }

  static async updateUserTier(userId: string, tier: TierType): Promise<void> {
    await sql`
      UPDATE users 
      SET tier = ${tier}, updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  static async incrementAiMessageUsage(userId: string): Promise<{ success: boolean; reason?: string }> {
    const userInfo = await this.getUserTierInfo(userId);
    if (!userInfo) {
      return { success: false, reason: 'User not found' };
    }

    // Check if we need to reset the counter
    if (shouldResetAiMessages(userInfo.aiMessagesResetAt)) {
      await sql`
        UPDATE users 
        SET ai_messages_used_today = 0, ai_messages_reset_at = NOW()
        WHERE id = ${userId}
      `;
      userInfo.aiMessagesUsedToday = 0;
    }

    // Check if user can send AI message
    const canSend = canUserPerformAction(userInfo.tier, 'sendAiMessage', {
      aiMessagesUsedToday: userInfo.aiMessagesUsedToday,
    });

    if (!canSend.allowed) {
      return { success: false, reason: canSend.reason };
    }

    // Increment usage
    await sql`
      UPDATE users 
      SET ai_messages_used_today = ai_messages_used_today + 1
      WHERE id = ${userId}
    `;

    return { success: true };
  }

  static async getOrganizationGuestCount(organizationId: string): Promise<number> {
    const [result] = await sql`
      SELECT COUNT(*) as count
      FROM guests 
      WHERE organization_id = ${organizationId}
    `;

    return parseInt(result.count);
  }

  static async canAddGuestToOrganization(userId: string, organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const userInfo = await this.getUserTierInfo(userId);
    if (!userInfo) {
      return { allowed: false, reason: 'User not found' };
    }

    const guestCount = await this.getOrganizationGuestCount(organizationId);
    
    return canUserPerformAction(userInfo.tier, 'addGuest', { guestCount });
  }

  static async canInviteToOrganization(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const userInfo = await this.getUserTierInfo(userId);
    if (!userInfo) {
      return { allowed: false, reason: 'User not found' };
    }

    return canUserPerformAction(userInfo.tier, 'inviteUser');
  }

  static async getAllUsersForAdmin(): Promise<Array<{
    id: string;
    email: string;
    name: string | null;
    tier: TierType;
    aiMessagesUsedToday: number;
    isSuperAdmin: boolean;
    createdAt: Date;
    organizationCount: number;
  }>> {
    const users = await sql`
      SELECT 
        u.id, u.email, u.name, u.tier, u.ai_messages_used_today, u.is_super_admin, u.created_at,
        COUNT(DISTINCT om.organization_id) as organization_count
      FROM users u
      LEFT JOIN organization_members om ON u.id = om.user_id
      GROUP BY u.id, u.email, u.name, u.tier, u.ai_messages_used_today, u.is_super_admin, u.created_at
      ORDER BY u.created_at DESC
    `;

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier as TierType,
      aiMessagesUsedToday: user.ai_messages_used_today,
      isSuperAdmin: user.is_super_admin,
      createdAt: user.created_at,
      organizationCount: parseInt(user.organization_count),
    }));
  }

  static async getAllOrganizationsForAdmin(): Promise<Array<{
    id: string;
    name: string;
    eventType: string;
    adminEmail: string;
    memberCount: number;
    guestCount: number;
    createdAt: Date;
  }>> {
    const orgs = await sql`
      SELECT 
        o.id, o.name, o.event_type, u.email as admin_email, o.created_at,
        COUNT(DISTINCT om.user_id) as member_count,
        COUNT(DISTINCT g.id) as guest_count
      FROM organizations o
      LEFT JOIN users u ON o.admin_id = u.id
      LEFT JOIN organization_members om ON o.id = om.organization_id
      LEFT JOIN guests g ON o.id = g.organization_id
      GROUP BY o.id, o.name, o.event_type, u.email, o.created_at
      ORDER BY o.created_at DESC
    `;

    return orgs.map(org => ({
      id: org.id,
      name: org.name,
      eventType: org.event_type,
      adminEmail: org.admin_email,
      memberCount: parseInt(org.member_count),
      guestCount: parseInt(org.guest_count),
      createdAt: org.created_at,
    }));
  }
}