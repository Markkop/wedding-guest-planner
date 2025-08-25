import { NextResponse } from 'next/server';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { TierService } from '@/lib/services/tier-service';

export async function GET() {
  try {
    const user = await safeRequireUser();
    
    const userInfo = await TierService.getUserTierInfo(user.id);
    
    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      tier: userInfo.tier,
      aiMessagesUsedToday: userInfo.aiMessagesUsedToday,
      isSuperAdmin: userInfo.isSuperAdmin,
    });
  } catch (error) {
    console.error('Error fetching user tier info:', error);
    return NextResponse.json({ error: 'Failed to fetch user tier info' }, { status: 500 });
  }
}