import { NextResponse } from 'next/server';
import { EventConfigService } from '@/lib/services/event-config-service';
import { OrganizationService } from '@/lib/services/organization-service';
import { z } from 'zod';

const categoryConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  initial: z.string().min(1).max(2),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});

const ageGroupConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  minAge: z.number().optional()
});

const foodPreferenceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1)
});

const confirmationStageConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number()
});

const eventConfigSchema = z.object({
  categories: z.array(categoryConfigSchema).min(1),
  ageGroups: z.object({
    enabled: z.boolean(),
    groups: z.array(ageGroupConfigSchema)
  }),
  foodPreferences: z.object({
    enabled: z.boolean(),
    options: z.array(foodPreferenceConfigSchema)
  }),
  confirmationStages: z.object({
    enabled: z.boolean(),
    stages: z.array(confirmationStageConfigSchema)
  })
});

const updateConfigSchema = z.object({
  event_type: z.string().optional(),
  configuration: eventConfigSchema.optional()
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const config = await EventConfigService.getOrganizationConfiguration(organizationId);
    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Failed to fetch organization config:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const body = await request.json();
    const data = updateConfigSchema.parse(body);
    
    const updatedOrg = await OrganizationService.updateOrganization(organizationId, data);
    return NextResponse.json({ organization: updatedOrg });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid configuration', details: error.errors }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Only admins can update organization configuration' || 
          error.message === 'Access denied') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.error('Failed to update organization config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}