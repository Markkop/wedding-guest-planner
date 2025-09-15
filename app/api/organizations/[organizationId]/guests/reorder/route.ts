import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';
import { z } from 'zod';

const reorderSchema = z.object({
  guestIds: z.array(z.string()),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const body = await request.json();
    const { guestIds } = reorderSchema.parse(body);
    
    await GuestService.reorderGuests(organizationId, guestIds);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return NextResponse.json({ error: errorMessage, details: error.errors }, { status: 400 });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Access denied') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to reorder guests' }, { status: 500 });
  }
}