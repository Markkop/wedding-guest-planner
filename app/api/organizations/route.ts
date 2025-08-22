import { NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1),
  event_type: z.string().default('wedding'),
  custom_config: z.any().optional(), // EventConfiguration partial
});

export async function GET() {
  try {
    const organizations = await OrganizationService.getUserOrganizations();
    return NextResponse.json({ organizations });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createOrgSchema.parse(body);
    
    const organization = await OrganizationService.createOrganization(
      data.name,
      data.event_type,
      data.custom_config
    );
    
    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}