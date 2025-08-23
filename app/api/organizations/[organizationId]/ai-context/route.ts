import { NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import type { EventConfiguration } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const organization = await OrganizationService.getOrganization(organizationId);
    const config = organization.configuration as EventConfiguration;

    // Extract all valid values for AI context
    const context = {
      organizationName: organization.name,
      eventType: organization.event_type,
      
      // Available categories
      categories: config.categories.map(cat => ({
        id: cat.id,
        label: cat.label,
        initial: cat.initial
      })),
      
      // Available age groups (if enabled)
      ageGroups: config.ageGroups.enabled ? {
        enabled: true,
        options: config.ageGroups.groups.map(group => ({
          id: group.id,
          label: group.label,
          minAge: group.minAge
        }))
      } : { enabled: false },
      
      // Available food preferences (if enabled)
      foodPreferences: config.foodPreferences.enabled ? {
        enabled: true,
        allowMultiple: config.foodPreferences.allowMultiple ?? true,
        options: config.foodPreferences.options.map(option => ({
          id: option.id,
          label: option.label
        }))
      } : { enabled: false },
      
      // Available confirmation stages (if enabled)
      confirmationStages: config.confirmationStages.enabled ? {
        enabled: true,
        options: config.confirmationStages.stages
          .sort((a, b) => a.order - b.order)
          .map(stage => ({
            id: stage.id,
            label: stage.label,
            order: stage.order
          }))
      } : { enabled: false },
      
      // Configuration rules
      rules: {
        categoriesAllowMultiple: config.categoriesConfig?.allowMultiple ?? false,
        foodPreferencesAllowMultiple: config.foodPreferences.allowMultiple ?? true
      }
    };

    return NextResponse.json({ context });
  } catch (error) {
    console.error('Failed to fetch AI context:', error);
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Organization not found or access denied') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to fetch AI context' }, { status: 500 });
  }
}