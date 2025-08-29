import { sql } from '@/lib/db';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { AuthService } from '@/lib/auth/auth-service';
import type { EventTypePreset, EventConfiguration } from '@/lib/types';

export class EventConfigService {
  static async getEventTypePresets() {
    const result = await sql`
      SELECT * FROM event_type_presets
      ORDER BY name ASC
    `;
    return result as EventTypePreset[];
  }

  static async getEventTypePreset(name: string) {
    const result = await sql`
      SELECT * FROM event_type_presets
      WHERE name = ${name}
      LIMIT 1
    `;
    return result[0] as EventTypePreset | undefined;
  }

  static async createCustomEventTypePreset(
    name: string,
    description: string,
    configuration: EventConfiguration
  ) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName ?? undefined,
      profileImageUrl: user.profileImageUrl ?? undefined
    });

    const result = await sql`
      INSERT INTO event_type_presets (name, description, default_config)
      VALUES (${name}, ${description}, ${JSON.stringify(configuration)})
      RETURNING *
    `;

    return result[0] as EventTypePreset;
  }

  static async updateOrganizationConfiguration(
    organizationId: string,
    eventType: string,
    configuration: EventConfiguration
  ) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName ?? undefined,
      profileImageUrl: user.profileImageUrl ?? undefined
    });

    // Check if user is admin of the organization
    const memberCheck = await sql`
      SELECT role FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0 || memberCheck[0].role !== 'admin') {
      throw new Error('Only admins can update organization configuration');
    }

    const result = await sql`
      UPDATE organizations
      SET 
        event_type = ${eventType},
        configuration = ${JSON.stringify(configuration)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${organizationId}
      RETURNING *
    `;

    return result[0];
  }

  static async getOrganizationConfiguration(organizationId: string) {
    const user = await safeRequireUser();

    // Sync Stack Auth user to local database first
    await AuthService.syncUserToDatabase({
      id: user.id,
      primaryEmail: user.primaryEmail || '',
      displayName: user.displayName ?? undefined,
      profileImageUrl: user.profileImageUrl ?? undefined
    });

    const memberCheck = await sql`
      SELECT * FROM organization_members
      WHERE organization_id = ${organizationId} AND user_id = ${user.id}
    `;

    if (memberCheck.length === 0) {
      throw new Error('Access denied');
    }

    const result = await sql`
      SELECT id, name, event_type, configuration
      FROM organizations
      WHERE id = ${organizationId}
    `;

    if (result.length === 0) {
      throw new Error('Organization not found');
    }

    return result[0];
  }

  /**
   * Validates that a configuration is complete and valid
   */
  static validateConfiguration(config: EventConfiguration): boolean {
    // Check categories
    if (!config.categories || config.categories.length === 0) {
      return false;
    }

    // Check that each category has required fields
    for (const category of config.categories) {
      if (!category.id || !category.label || !category.initial) {
        return false;
      }
    }

    // Check confirmation stages
    if (config.confirmationStages.enabled && 
        (!config.confirmationStages.stages || config.confirmationStages.stages.length === 0)) {
      return false;
    }

    // If age groups are enabled, check they exist
    if (config.ageGroups.enabled && 
        (!config.ageGroups.groups || config.ageGroups.groups.length === 0)) {
      return false;
    }

    // If food preferences are enabled, check they exist
    if (config.foodPreferences.enabled && 
        (!config.foodPreferences.options || config.foodPreferences.options.length === 0)) {
      return false;
    }

    // Validate custom fields if they exist
    if (config.customFields) {
      for (const field of config.customFields) {
        if (!field.id || !field.label || !field.type) {
          return false;
        }
        // For select types, ensure options exist
        if ((field.type === 'single-select' || field.type === 'multi-select') && 
            (!field.options || field.options.length === 0)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Merges a preset configuration with custom overrides
   */
  static mergeConfiguration(
    baseConfig: EventConfiguration, 
    overrides: Partial<EventConfiguration>
  ): EventConfiguration {
    return {
      categories: overrides.categories || baseConfig.categories,
      categoriesConfig: overrides.categoriesConfig || baseConfig.categoriesConfig,
      ageGroups: {
        enabled: overrides.ageGroups?.enabled ?? baseConfig.ageGroups.enabled,
        groups: overrides.ageGroups?.groups || baseConfig.ageGroups.groups
      },
      foodPreferences: {
        enabled: overrides.foodPreferences?.enabled ?? baseConfig.foodPreferences.enabled,
        allowMultiple: overrides.foodPreferences?.allowMultiple ?? baseConfig.foodPreferences?.allowMultiple,
        options: overrides.foodPreferences?.options || baseConfig.foodPreferences.options
      },
      confirmationStages: {
        enabled: overrides.confirmationStages?.enabled ?? baseConfig.confirmationStages.enabled,
        stages: overrides.confirmationStages?.stages || baseConfig.confirmationStages.stages
      },
      customFields: overrides.customFields || baseConfig.customFields || []
    };
  }
}