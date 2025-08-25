import { NextResponse } from 'next/server';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { TierService } from '@/lib/services/tier-service';

export async function GET() {
  try {
    const user = await safeRequireUser();
    
    // Check if user is super admin
    const userInfo = await TierService.getUserTierInfo(user.id);
    if (!userInfo?.isSuperAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const users = await TierService.getAllUsersForAdmin();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}