import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { z } from 'zod';

const updateGuestSchema = z.object({
  name: z.string().min(1).optional(),
  categories: z.array(z.string()).optional(),
  age_group: z.string().optional(),
  food_preference: z.string().optional(),
  food_preferences: z.array(z.string()).optional(),
  confirmation_stage: z.string().optional(),
  custom_fields: z.record(z.any()).nullable().optional(),
  family_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').nullable().optional(),
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
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return NextResponse.json({ error: errorMessage, details: error.errors }, { status: 400 });
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