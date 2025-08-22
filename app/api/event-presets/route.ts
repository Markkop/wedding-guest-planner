import { NextResponse } from 'next/server';
import { EventConfigService } from '@/lib/services/event-config-service';

export async function GET() {
  try {
    const presets = await EventConfigService.getEventTypePresets();
    return NextResponse.json({ presets });
  } catch (error) {
    console.error('Failed to fetch event presets:', error);
    return NextResponse.json({ error: 'Failed to fetch event presets' }, { status: 500 });
  }
}