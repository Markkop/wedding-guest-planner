import { sql } from '@/lib/db';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import type { Guest } from '@/lib/db';

export class GuestService {
  static async getGuests(organizationId: string) {
    const user = await safeRequireUser();

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
      category?: 'partner1' | 'partner2';
      age_group?: 'adult' | '7years' | '11years';
      food_preference?: 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free';
    }
  ) {
    const user = await safeRequireUser();

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

    const result = await sql`
      INSERT INTO guests (
        organization_id, name, category, age_group, 
        food_preference, display_order, created_by
      )
      VALUES (
        ${organizationId},
        ${data.name},
        ${data.category || 'partner1'},
        ${data.age_group || 'adult'},
        ${data.food_preference || 'none'},
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
      category: 'partner1' | 'partner2';
      age_group: 'adult' | '7years' | '11years';
      food_preference: 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free';
      confirmation_stage: number;
      declined: boolean;
    }>
  ) {
    const user = await safeRequireUser();

    const guestCheck = await sql`
      SELECT g.*, om.user_id
      FROM guests g
      JOIN organization_members om ON g.organization_id = om.organization_id
      WHERE g.id = ${guestId} AND om.user_id = ${user.id}
    `;

    if (guestCheck.length === 0) {
      throw new Error('Guest not found or access denied');
    }

    const updates = [];
    const values = [];
    
    if (data.name !== undefined) {
      updates.push(`name = $${values.length + 2}`);
      values.push(data.name);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${values.length + 2}`);
      values.push(data.category);
    }
    if (data.age_group !== undefined) {
      updates.push(`age_group = $${values.length + 2}`);
      values.push(data.age_group);
    }
    if (data.food_preference !== undefined) {
      updates.push(`food_preference = $${values.length + 2}`);
      values.push(data.food_preference);
    }
    if (data.confirmation_stage !== undefined) {
      updates.push(`confirmation_stage = $${values.length + 2}`);
      values.push(data.confirmation_stage);
    }
    if (data.declined !== undefined) {
      updates.push(`declined = $${values.length + 2}`);
      values.push(data.declined);
    }

    if (updates.length === 0) {
      return guestCheck[0];
    }

    const query = `
      UPDATE guests
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await sql(query, [guestId, ...values]);
    return result[0] as Guest;
  }

  static async deleteGuest(guestId: string) {
    const user = await safeRequireUser();

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

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN confirmation_stage = 3 AND NOT declined THEN 1 END) as confirmed,
        COUNT(CASE WHEN category = 'partner1' AND NOT declined THEN 1 END) as partner1_count,
        COUNT(CASE WHEN category = 'partner2' AND NOT declined THEN 1 END) as partner2_count
      FROM guests
      WHERE organization_id = ${organizationId}
    `;

    return stats[0];
  }
}