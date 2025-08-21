import { nanoid } from 'nanoid';
import { sql } from '@/lib/db';
import { safeRequireUser, safeGetUser } from '@/lib/auth/safe-stack';
import type { Organization, OrganizationMember } from '@/lib/db';

export class OrganizationService {
  static generateInviteCode(): string {
    return nanoid(8).toUpperCase();
  }

  static async createOrganization(
    name: string,
    partner1Label = 'Bride',
    partner1Initial = 'B',
    partner2Label = 'Groom',
    partner2Initial = 'G'
  ) {
    const user = await safeRequireUser();

    const inviteCode = this.generateInviteCode();

    const result = await sql`
      INSERT INTO organizations (
        name, invite_code, admin_id,
        partner1_label, partner1_initial,
        partner2_label, partner2_initial
      )
      VALUES (
        ${name}, ${inviteCode}, ${user.id},
        ${partner1Label}, ${partner1Initial},
        ${partner2Label}, ${partner2Initial}
      )
      RETURNING *
    `;

    const org = result[0];

    await sql`
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES (${org.id}, ${user.id}, 'admin')
    `;

    return org;
  }

  static async joinOrganization(inviteCode: string) {
    const user = await safeRequireUser();

    const orgResult = await sql`
      SELECT * FROM organizations WHERE invite_code = ${inviteCode}
    `;

    if (orgResult.length === 0) {
      throw new Error('Invalid invite code');
    }

    const org = orgResult[0];

    const existingMember = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${org.id} AND user_id = ${user.id}
    `;

    if (existingMember.length > 0) {
      return org;
    }

    await sql`
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES (${org.id}, ${user.id}, 'member')
    `;

    return org;
  }

  static async getUserOrganizations() {
    const user = await safeGetUser();
    if (!user) return [];

    const result = await sql`
      SELECT o.*, om.role
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = ${user.id}
      ORDER BY o.created_at DESC
    `;

    return result;
  }

  static async getOrganization(organizationId: string) {
    const user = await safeRequireUser();

    const result = await sql`
      SELECT o.*, om.role
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ${organizationId} AND om.user_id = ${user.id}
    `;

    if (result.length === 0) {
      throw new Error('Organization not found or access denied');
    }

    return result[0];
  }

  static async updateOrganization(
    organizationId: string,
    data: {
      name?: string;
      partner1_label?: string;
      partner1_initial?: string;
      partner2_label?: string;
      partner2_initial?: string;
    }
  ) {
    const user = await safeRequireUser();

    const memberCheck = await sql`
      SELECT role FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0 || memberCheck[0].role !== 'admin') {
      throw new Error('Only admins can update organization settings');
    }

    const result = await sql`
      UPDATE organizations
      SET name = COALESCE(${data.name}, name),
          partner1_label = COALESCE(${data.partner1_label}, partner1_label),
          partner1_initial = COALESCE(${data.partner1_initial}, partner1_initial),
          partner2_label = COALESCE(${data.partner2_label}, partner2_label),
          partner2_initial = COALESCE(${data.partner2_initial}, partner2_initial)
      WHERE id = ${organizationId}
      RETURNING *
    `;

    return result[0];
  }

  static async getOrganizationMembers(organizationId: string) {
    const user = await safeRequireUser();

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    const result = await sql`
      SELECT u.id, u.email, u.name, u.avatar_url, om.role, om.joined_at
      FROM users u
      JOIN organization_members om ON u.id = om.user_id
      WHERE om.organization_id = ${organizationId}
      ORDER BY om.joined_at ASC
    `;

    return result;
  }

  static async getActiveMembers(organizationId: string) {
    const result = await sql`
      SELECT u.id, u.email, u.name, u.avatar_url
      FROM users u
      JOIN active_sessions as ON u.id = as.user_id
      WHERE as.organization_id = ${organizationId}
        AND as.last_activity > NOW() - INTERVAL '5 minutes'
    `;

    return result;
  }

  static async updateActiveSession(organizationId: string) {
    const user = await safeGetUser();
    if (!user) return;

    await sql`
      INSERT INTO active_sessions (user_id, organization_id, last_activity)
      VALUES (${user.id}, ${organizationId}, NOW())
      ON CONFLICT (user_id, organization_id)
      DO UPDATE SET last_activity = NOW()
    `;
  }
}