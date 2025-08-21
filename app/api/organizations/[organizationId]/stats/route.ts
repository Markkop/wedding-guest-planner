import { NextResponse } from 'next/server';
import { GuestService } from '@/lib/services/guest-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const stats = await GuestService.getGuestStatistics(organizationId);
    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'Access denied') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}