import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params;
    await GuestService.moveGuestToEnd(guestId);
    
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
    
    return NextResponse.json({ error: 'Failed to move guest' }, { status: 500 });
  }
}