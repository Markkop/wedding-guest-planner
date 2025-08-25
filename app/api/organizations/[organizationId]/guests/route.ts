import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { TierService } from '@/lib/services/tier-service';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { z } from 'zod';

const createGuestSchema = z.object({
  name: z.string().min(1),
  categories: z.array(z.string()).optional(),
  age_group: z.string().optional(),
  food_preference: z.string().optional(),
  confirmation_stage: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const guests = await GuestService.getGuests(organizationId);
    return NextResponse.json({ guests });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Access denied') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const user = await safeRequireUser();
    const { organizationId } = await params;
    const body = await request.json();
    const data = createGuestSchema.parse(body);
    
    // Check guest limits
    const canAdd = await TierService.canAddGuestToOrganization(user.id, organizationId);
    if (!canAdd.allowed) {
      return NextResponse.json({ error: canAdd.reason }, { status: 403 });
    }
    
    const guest = await GuestService.createGuest(organizationId, data);
    
    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Access denied') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 });
  }
}