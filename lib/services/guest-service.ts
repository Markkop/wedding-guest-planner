import { sql } from '@/lib/db';
import { AuthService } from '@/lib/auth/auth-service';
import type { Guest } from '@/lib/db';
import type { EventConfiguration } from '@/lib/types';

export class GuestService {
  /**
   * Get effective user ID with email fallback for membership checks
   */
  private static async getEffectiveUserIdForCheck(userId: string, emails: string[]): Promise<string> {
    // Try ID-based lookup first
    let memberCheck = await sql`
      SELECT user_id FROM organization_members WHERE user_id = ${userId} LIMIT 1
    `;
    if (memberCheck.length > 0) {
      return userId;
    }

    // Fall back to email-based lookup
    const effectiveUserId = await AuthService.getEffectiveUserId(userId, emails);
    return effectiveUserId || userId;
  }

  static async getGuests(organizationId: string) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${effectiveUserId}
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
      food_preferences?: string[];
      confirmation_stage?: string;
      custom_fields?: Record<string, unknown> | null;
      family_color?: string | null;
      target_position?: number;
    }
  ) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${effectiveUserId}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    let nextOrder: number;

    if (data.target_position !== undefined) {
      // Insert at specific position - shift all guests at or after this position down
      await sql`
        UPDATE guests
        SET display_order = display_order + 1
        WHERE organization_id = ${organizationId}
          AND display_order >= ${data.target_position}
      `;
      nextOrder = data.target_position;
    } else {
      // Add to end (default behavior)
      const maxOrderResult = await sql`
        SELECT COALESCE(MAX(display_order), 0) as max_order
        FROM guests
        WHERE organization_id = ${organizationId}
      `;
      nextOrder = (maxOrderResult[0].max_order || 0) + 1;
    }

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
    const foodPreferences = data.food_preferences || (config?.foodPreferences?.enabled ? [config?.foodPreferences?.options?.[0]?.id].filter(Boolean) : []);
    const confirmationStage = data.confirmation_stage || (config?.confirmationStages?.enabled ? config?.confirmationStages?.stages?.[0]?.id : 'invited');

    const result = await sql`
      INSERT INTO guests (
        organization_id, name, categories, age_group, 
        food_preference, food_preferences, confirmation_stage, 
        custom_fields, family_color, display_order, created_by
      )
      VALUES (
        ${organizationId},
        ${data.name},
        ${categories},
        ${ageGroup},
        ${foodPreference},
        ${JSON.stringify(foodPreferences)},
        ${confirmationStage},
        ${data.custom_fields ? JSON.stringify(data.custom_fields) : '{}'},
        ${data.family_color || null},
        ${nextOrder},
        ${effectiveUserId}
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
      food_preferences: string[];
      confirmation_stage: string;
      custom_fields: Record<string, unknown> | null;
      family_color: string | null;
    }>
  ) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    const guestCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id = ${guestId} AND om.user_id = ${effectiveUserId}
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
        food_preferences = COALESCE(${data.food_preferences ? JSON.stringify(data.food_preferences) : null}, food_preferences),
        confirmation_stage = COALESCE(${data.confirmation_stage}, confirmation_stage),
        custom_fields = COALESCE(${data.custom_fields ? JSON.stringify(data.custom_fields) : null}, custom_fields),
        family_color = CASE 
          WHEN ${data.family_color !== undefined} THEN ${data.family_color}
          ELSE family_color
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${guestId}
      RETURNING *
    `;
    return result[0] as Guest;
  }

  static async deleteGuest(guestId: string) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    const guestCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id = ${guestId} AND om.user_id = ${effectiveUserId}
    `;

    if (guestCheck.length === 0) {
      throw new Error('Guest not found or access denied');
    }

    await sql`DELETE FROM guests WHERE id = ${guestId}`;

    return { success: true };
  }

  static async reorderGuests(organizationId: string, guestIds: string[]) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${effectiveUserId}
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
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    const guestCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id = ${guestId} AND om.user_id = ${effectiveUserId}
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

  static async moveGuestToBeginning(guestId: string) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
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

    // Shift all existing guests down by 1
    await sql`
      UPDATE guests
      SET display_order = display_order + 1
      WHERE organization_id = ${guest.organization_id}
    `;

    // Move the target guest to position 1
    await sql`
      UPDATE guests
      SET display_order = 1
      WHERE id = ${guestId}
    `;

    return { success: true };
  }

  static async moveGuestToPosition(guestId: string, targetPosition: number) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
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
    const currentPosition = guest.display_order;

    if (targetPosition < 1) {
      throw new Error('Target position must be 1 or greater');
    }

    // Get total number of guests to validate target position
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM guests
      WHERE organization_id = ${guest.organization_id}
    `;

    const totalGuests = Number(countResult[0].total);

    // If target position is beyond the total, treat it as "move to end"
    const effectiveTargetPosition = targetPosition > totalGuests ? totalGuests : targetPosition;

    if (currentPosition === effectiveTargetPosition) {
      return { success: true, message: 'Guest is already at the target position' };
    }

    if (currentPosition < effectiveTargetPosition) {
      // Moving down: shift guests between current and target positions up
      await sql`
        UPDATE guests
        SET display_order = display_order - 1
        WHERE organization_id = ${guest.organization_id}
          AND display_order > ${currentPosition}
          AND display_order <= ${effectiveTargetPosition}
      `;
    } else {
      // Moving up: shift guests between target and current positions down
      await sql`
        UPDATE guests
        SET display_order = display_order + 1
        WHERE organization_id = ${guest.organization_id}
          AND display_order >= ${effectiveTargetPosition}
          AND display_order < ${currentPosition}
      `;
    }

    // Move the target guest to the new position
    await sql`
      UPDATE guests
      SET display_order = ${effectiveTargetPosition}
      WHERE id = ${guestId}
    `;

    return { success: true };
  }

  static async swapGuestPositions(guestId1: string, guestId2: string) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    // Get both guests and verify access
    const guestsCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id IN (${guestId1}, ${guestId2}) AND om.user_id = ${effectiveUserId}
    `;

    if (guestsCheck.length !== 2) {
      throw new Error('One or both guests not found or access denied');
    }

    const guest1 = guestsCheck.find(g => g.id === guestId1);
    const guest2 = guestsCheck.find(g => g.id === guestId2);

    if (!guest1 || !guest2) {
      throw new Error('Could not find both guests');
    }

    if (guest1.organization_id !== guest2.organization_id) {
      throw new Error('Both guests must be in the same organization');
    }

    const position1 = guest1.display_order;
    const position2 = guest2.display_order;

    // Swap positions
    await sql`
      UPDATE guests
      SET display_order = ${position2}
      WHERE id = ${guestId1}
    `;

    await sql`
      UPDATE guests
      SET display_order = ${position1}
      WHERE id = ${guestId2}
    `;

    return { success: true };
  }

  static async getGuestStatistics(organizationId: string) {
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    // Get effective user ID with email fallback
    const emails = user.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
    const effectiveUserId = await this.getEffectiveUserIdForCheck(user.id, emails);

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${effectiveUserId}
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