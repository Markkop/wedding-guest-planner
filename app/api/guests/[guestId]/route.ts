import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { z } from 'zod';

const updateGuestSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['partner1', 'partner2']).optional(),
  age_group: z.enum(['adult', '7years', '11years']).optional(),
  food_preference: z.enum(['none', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free']).optional(),
  confirmation_stage: z.number().min(0).max(3).optional(),
  declined: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params;
    const body = await request.json();
    const data = updateGuestSchema.parse(body);
    
    const guest = await GuestService.updateGuest(guestId, data);
    
    return NextResponse.json({ guest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Guest not found or access denied') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params;
    await GuestService.deleteGuest(guestId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Guest not found or access denied') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to delete guest' }, { status: 500 });
  }
}