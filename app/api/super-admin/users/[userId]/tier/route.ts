import { NextRequest, NextResponse } from 'next/server';
import { safeRequireUser } from '@/lib/auth/safe-stack';
import { TierService } from '@/lib/services/tier-service';
import { z } from 'zod';

const updateTierSchema = z.object({
  tier: z.enum(['free', 'plus', 'pro']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await safeRequireUser();
    const { userId } = await params;
    
    // Check if user is super admin
    const userInfo = await TierService.getUserTierInfo(user.id);
    if (!userInfo?.isSuperAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { tier } = updateTierSchema.parse(body);

    await TierService.updateUserTier(userId, tier);
    
    return NextResponse.json({ success: true, message: 'User tier updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid tier value' }, { status: 400 });
    }
    
    console.error('Error updating user tier:', error);
    return NextResponse.json({ error: 'Failed to update user tier' }, { status: 500 });
  }
}