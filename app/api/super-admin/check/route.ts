import { NextResponse } from 'next/server';
import { safeGetUser } from '@/lib/auth/safe-stack';
import { TierService } from '@/lib/services/tier-service';

export async function GET() {
  try {
    const user = await safeGetUser();
    
    if (!user) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 401 });
    }

    const userInfo = await TierService.getUserTierInfo(user.id);
    
    if (!userInfo) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 404 });
    }

    return NextResponse.json({ isSuperAdmin: userInfo.isSuperAdmin });
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return NextResponse.json({ isSuperAdmin: false }, { status: 500 });
  }
}