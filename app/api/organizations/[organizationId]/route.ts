import { NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import { z } from 'zod';

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  partner1_label: z.string().min(1).optional(),
  partner1_initial: z.string().length(1).optional(),
  partner2_label: z.string().min(1).optional(),
  partner2_initial: z.string().length(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const body = await request.json();
    const data = updateOrganizationSchema.parse(body);
    
    const organization = await OrganizationService.updateOrganization(organizationId, data);
    
    return NextResponse.json({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Organization not found or access denied') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}