import { nanoid } from 'nanoid';
import { sql } from '@/lib/db';
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
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
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
    const user = await AuthService.requireUserFull();

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
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
    try {
      const authResult = await AuthService.getCurrentUser();
      if (!authResult.userId) return [];

      // Sync Clerk user to local database first (this will migrate if needed)
      const clerkUser = await AuthService.getCurrentUserFull();
      if (!clerkUser) {
        console.error('No Clerk user found');
        return [];
      }

      try {
        await AuthService.syncUserToDatabase({
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl
        });
      } catch (syncError) {
        console.error('Error syncing user to database:', syncError);
        // Continue with lookup even if sync fails
      }

      // Try ID-based lookup first (backward compatibility)
      // After sync, the Clerk ID should be in the database (either existing or migrated)
      let userId = authResult.userId;
      let result = await sql`
        SELECT o.*, om.role
        FROM organizations o
        JOIN organization_members om ON o.id = om.organization_id
        WHERE om.user_id = ${userId}
        ORDER BY o.created_at DESC
      `;

      // If no results, try email-based fallback
      if (result.length === 0) {
        try {
          const emails = clerkUser.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
          const effectiveUserId = await AuthService.getEffectiveUserId(clerkUser.id, emails);
          if (effectiveUserId && effectiveUserId !== userId) {
            userId = effectiveUserId;
            result = await sql`
              SELECT o.*, om.role
              FROM organizations o
              JOIN organization_members om ON o.id = om.organization_id
              WHERE om.user_id = ${userId}
              ORDER BY o.created_at DESC
            `;
          }
        } catch (fallbackError) {
          console.error('Error in email fallback:', fallbackError);
          // Return empty array if fallback fails
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getUserOrganizations:', error);
      throw error;
    }
  }

  static async getOrganization(organizationId: string) {
    const authResult = await AuthService.requireUser();

    // Try ID-based lookup first (backward compatibility)
    let userId = authResult.userId;
    let result = await sql`
      SELECT o.*, om.role
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ${organizationId} AND om.user_id = ${userId}
    `;

    // If no results and we have Clerk user, try email-based fallback
    if (result.length === 0) {
      const clerkUser = await AuthService.getCurrentUserFull();
      if (clerkUser) {
        const emails = clerkUser.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
        const effectiveUserId = await AuthService.getEffectiveUserId(clerkUser.id, emails);
        if (effectiveUserId && effectiveUserId !== userId) {
          userId = effectiveUserId;
          result = await sql`
            SELECT o.*, om.role
            FROM organizations o
            JOIN organization_members om ON o.id = om.organization_id
            WHERE o.id = ${organizationId} AND om.user_id = ${userId}
          `;
        }
      }
    }

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
    const authResult = await AuthService.requireUser();

    // Try ID-based lookup first (backward compatibility)
    let userId = authResult.userId;
    let memberCheck = await sql`
      SELECT role FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${userId}
    `;

    // If no results and we have Clerk user, try email-based fallback
    if (memberCheck.length === 0) {
      const clerkUser = await AuthService.getCurrentUserFull();
      if (clerkUser) {
        const emails = clerkUser.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
        const effectiveUserId = await AuthService.getEffectiveUserId(clerkUser.id, emails);
        if (effectiveUserId && effectiveUserId !== userId) {
          userId = effectiveUserId;
          memberCheck = await sql`
            SELECT role FROM organization_members
            WHERE organization_id = ${organizationId} AND user_id = ${userId}
          `;
        }
      }
    }

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
    const authResult = await AuthService.requireUser();

    // Try ID-based lookup first (backward compatibility)
    let userId = authResult.userId;
    let memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${userId}
    `;

    // If no results and we have Clerk user, try email-based fallback
    if (memberCheck.length === 0) {
      const clerkUser = await AuthService.getCurrentUserFull();
      if (clerkUser) {
        const emails = clerkUser.emailAddresses?.map(e => e.emailAddress).filter(Boolean) || [];
        const effectiveUserId = await AuthService.getEffectiveUserId(clerkUser.id, emails);
        if (effectiveUserId && effectiveUserId !== userId) {
          userId = effectiveUserId;
          memberCheck = await sql`
            SELECT * FROM organization_members
            WHERE organization_id = ${organizationId} AND user_id = ${userId}
          `;
        }
      }
    }

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
    const user = await AuthService.getCurrentUserFull();
    if (!user) return;

    // Sync Clerk user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    await sql`
      INSERT INTO active_sessions (user_id, organization_id, last_activity)
      VALUES (${user.id}, ${organizationId}, NOW())
      ON CONFLICT (user_id, organization_id)
      DO UPDATE SET last_activity = NOW()
    `;
  }
}