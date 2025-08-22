import { sql } from '@/lib/db';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { AuthService } from '@/lib/auth/auth-service';
import type { Guest } from '@/lib/db';
import type { EventConfiguration } from '@/lib/types';

export class GuestService {
  static async getGuests(organizationId: string) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
    });

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    const result = await sql`
      SELECT * FROM guests
      WHERE organization_id = ${organizationId}
      ORDER BY display_order ASC
    `;

    return result as Guest[];
  }

  static async createGuest(
    organizationId: string,
    data: {
      name: string;
      categories?: string[];
      age_group?: string;
      food_preference?: string;
      confirmation_stage?: string;
    }
  ) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
    });

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    const maxOrderResult = await sql`
      SELECT COALESCE(MAX(display_order), 0) as max_order
      FROM guests
      WHERE organization_id = ${organizationId}
    `;

    const nextOrder = (maxOrderResult[0].max_order || 0) + 1;

    // Get organization configuration to set defaults
    const orgResult = await sql`
      SELECT configuration FROM organizations WHERE id = ${organizationId}
    `;
    
    if (orgResult.length === 0) {
      throw new Error('Organization not found');
    }
    
    const config = orgResult[0].configuration as EventConfiguration;
    
    // Set defaults based on configuration
    const categories = data.categories || [config?.categories?.[0]?.id || ''];
    const ageGroup = data.age_group || (config?.ageGroups?.enabled ? config?.ageGroups?.groups?.[0]?.id : null);
    const foodPreference = data.food_preference || (config?.foodPreferences?.enabled ? config?.foodPreferences?.options?.[0]?.id : null);
    const confirmationStage = data.confirmation_stage || (config?.confirmationStages?.enabled ? config?.confirmationStages?.stages?.[0]?.id : 'invited');

    const result = await sql`
      INSERT INTO guests (
        organization_id, name, categories, age_group, 
        food_preference, confirmation_stage, display_order, created_by
      )
      VALUES (
        ${organizationId},
        ${data.name},
        ${categories},
        ${ageGroup},
        ${foodPreference},
        ${confirmationStage},
        ${nextOrder},
        ${user.id}
      )
      RETURNING *
    `;

    return result[0] as Guest;
  }

  static async updateGuest(
    guestId: string,
    data: Partial<{
      name: string;
      categories: string[];
      age_group: string;
      food_preference: string;
      confirmation_stage: string;
      custom_fields: Record<string, unknown>;
    }>
  ) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
    });

    const guestCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id = ${guestId} AND om.user_id = ${user.id}
    `;

    if (guestCheck.length === 0) {
      throw new Error('Guest not found or access denied');
    }

    if (Object.keys(data).length === 0) {
      return guestCheck[0];
    }

    const result = await sql`
      UPDATE guests
      SET 
        name = COALESCE(${data.name}, name),
        categories = COALESCE(${data.categories || null}, categories),
        age_group = COALESCE(${data.age_group}, age_group),
        food_preference = COALESCE(${data.food_preference}, food_preference),
        confirmation_stage = COALESCE(${data.confirmation_stage}, confirmation_stage),
        custom_fields = COALESCE(${data.custom_fields ? JSON.stringify(data.custom_fields) : null}, custom_fields),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${guestId}
      RETURNING *
    `;
    return result[0] as Guest;
  }

  static async deleteGuest(guestId: string) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
    });

    const guestCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id = ${guestId} AND om.user_id = ${user.id}
    `;

    if (guestCheck.length === 0) {
      throw new Error('Guest not found or access denied');
    }

    await sql`DELETE FROM guests WHERE id = ${guestId}`;
    
    return { success: true };
  }

  static async reorderGuests(organizationId: string, guestIds: string[]) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
    });

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    for (let i = 0; i < guestIds.length; i++) {
      await sql`
        UPDATE guests
        SET display_order = ${i + 1}
        WHERE id = ${guestIds[i]} AND organization_id = ${organizationId}
      `;
    }

    return { success: true };
  }

  static async moveGuestToEnd(guestId: string) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
    });

    const guestCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id = ${guestId} AND om.user_id = ${user.id}
    `;

    if (guestCheck.length === 0) {
      throw new Error('Guest not found or access denied');
    }

    const guest = guestCheck[0];

    const maxOrderResult = await sql`
      SELECT COALESCE(MAX(display_order), 0) as max_order
      FROM guests
      WHERE organization_id = ${guest.organization_id}
    `;

    const maxOrder = maxOrderResult[0].max_order || 0;

    await sql`
      UPDATE guests
      SET display_order = ${maxOrder + 1}
      WHERE id = ${guestId}
    `;

    return { success: true };
  }

  static async getGuestStatistics(organizationId: string) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl
    });

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    // Get organization configuration for dynamic statistics
    const orgResult = await sql`
      SELECT configuration FROM organizations WHERE id = ${organizationId}
    `;
    
    if (orgResult.length === 0) {
      throw new Error('Organization not found');
    }
    
    const config = orgResult[0].configuration as EventConfiguration;
    
    // Basic stats
    const basicStats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN confirmation_stage = 'invited' THEN 1 END) as invited
      FROM guests
      WHERE organization_id = ${organizationId}
    `;
    
    // Get confirmation stage counts
    const stageStats = await sql`
      SELECT confirmation_stage, COUNT(*) as count
      FROM guests
      WHERE organization_id = ${organizationId}
      GROUP BY confirmation_stage
    `;
    
    // Get category counts (handle TEXT[] array)
    const categoryStats = await sql`
      SELECT 
        unnest(categories) as category,
        COUNT(*) as count
      FROM guests
      WHERE organization_id = ${organizationId}
      GROUP BY unnest(categories)
    `;
    
    const byConfirmationStage: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    // Populate confirmation stage counts
    const stages = config?.confirmationStages?.stages || [];
    for (const stage of stages) {
      byConfirmationStage[stage.id] = 0;
    }
    for (const stat of stageStats) {
      byConfirmationStage[stat.confirmation_stage] = Number(stat.count);
    }
    
    // Populate category counts
    const categories = config?.categories || [];
    for (const category of categories) {
      byCategory[category.id] = 0;
    }
    for (const stat of categoryStats) {
      byCategory[stat.category] = Number(stat.count);
    }
    
    const stats = {
      total: Number(basicStats[0].total),
      invited: Number(basicStats[0].invited),
      confirmed: byConfirmationStage.confirmed || 0,
      declined: byConfirmationStage.declined || 0,
      byCategory,
      byConfirmationStage
    };

    return stats;
  }
}