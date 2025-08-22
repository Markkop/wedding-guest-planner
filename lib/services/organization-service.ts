import { nanoid } from 'nanoid';
import { sql } from '@/lib/db';
import { safeRequireUser, safeGetUser } from '@/lib/auth/safe-stack';
import { AuthService } from '@/lib/auth/auth-service';
import { EventConfigService } from './event-config-service';
import type { EventConfiguration } from '@/lib/types';

export class OrganizationService {
  static generateInviteCode(): string {
    return nanoid(8).toUpperCase();
  }

  static async createOrganization(
    name: string,
    eventType: string = 'wedding',
    customConfig?: Partial<EventConfiguration>
  ) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName ?? undefined,
      profileImageUrl: user.profileImageUrl ?? undefined
    });

    const inviteCode = this.generateInviteCode();

    // Get the preset configuration for the event type
    const preset = await EventConfigService.getEventTypePreset(eventType);
    if (!preset) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    // Merge preset with custom configuration if provided
    const finalConfig = customConfig 
      ? EventConfigService.mergeConfiguration(preset.default_config, customConfig)
      : preset.default_config;

    // Validate the final configuration
    if (!EventConfigService.validateConfiguration(finalConfig)) {
      throw new Error('Invalid event configuration');
    }

    const result = await sql`
      INSERT INTO organizations (
        name, invite_code, admin_id, event_type, configuration
      )
      VALUES (
        ${name}, ${inviteCode}, ${user.id}, ${eventType}, ${JSON.stringify(finalConfig)}
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

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName ?? undefined,
      profileImageUrl: user.profileImageUrl ?? undefined
    });

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
      event_type?: string;
      configuration?: EventConfiguration;
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

    // If updating configuration, validate it first
    if (data.configuration && !EventConfigService.validateConfiguration(data.configuration)) {
      throw new Error('Invalid event configuration');
    }

    const result = await sql`
      UPDATE organizations
      SET name = COALESCE(${data.name}, name),
          event_type = COALESCE(${data.event_type}, event_type),
          configuration = COALESCE(${data.configuration ? JSON.stringify(data.configuration) : null}, configuration),
          updated_at = CURRENT_TIMESTAMP
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

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName ?? undefined,
      profileImageUrl: user.profileImageUrl ?? undefined
    });

    await sql`
      INSERT INTO active_sessions (user_id, organization_id, last_activity)
      VALUES (${user.id}, ${organizationId}, NOW())
      ON CONFLICT (user_id, organization_id)
      DO UPDATE SET last_activity = NOW()
    `;
  }
}