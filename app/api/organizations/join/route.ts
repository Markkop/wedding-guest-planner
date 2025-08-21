import { NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import { z } from 'zod';

const joinOrgSchema = z.object({
  invite_code: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invite_code } = joinOrgSchema.parse(body);
    
    const organization = await OrganizationService.joinOrganization(invite_code);
    
    return NextResponse.json({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Invalid invite code') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 });
  }
}