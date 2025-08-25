export type TierType = 'free' | 'plus' | 'pro';

export interface TierLimits {
  maxGuests: number;
  maxAiMessagesPerDay: number;
  canInviteUsers: boolean;
  hasFeatureRequests: boolean;
}

export const TIER_LIMITS: Record<TierType, TierLimits> = {
  free: {
    maxGuests: 30,
    maxAiMessagesPerDay: 10,
    canInviteUsers: false,
    hasFeatureRequests: false,
  },
  plus: {
    maxGuests: 200,
    maxAiMessagesPerDay: 50,
    canInviteUsers: true,
    hasFeatureRequests: false,
  },
  pro: {
    maxGuests: 500,
    maxAiMessagesPerDay: 100,
    canInviteUsers: true,
    hasFeatureRequests: true,
  },
};

export const TIER_NAMES: Record<TierType, string> = {
  free: 'Free',
  plus: 'Plus',
  pro: 'Pro',
};

export const TIER_PRICES: Record<TierType, { usd: number; brl: number } | null> = {
  free: null,
  plus: { usd: 10, brl: 50 },
  pro: { usd: 30, brl: 150 },
};

export function getTierLimits(tier: TierType): TierLimits {
  return TIER_LIMITS[tier];
}

export function canUserPerformAction(
  userTier: TierType,
  action: 'addGuest' | 'sendAiMessage' | 'inviteUser' | 'requestFeature',
  currentCounts?: {
    guestCount?: number;
    aiMessagesUsedToday?: number;
  }
): { allowed: boolean; reason?: string } {
  const limits = getTierLimits(userTier);

  switch (action) {
    case 'addGuest':
      if (currentCounts?.guestCount !== undefined && currentCounts.guestCount >= limits.maxGuests) {
        return {
          allowed: false,
          reason: `You've reached the limit of ${limits.maxGuests} guests for the ${TIER_NAMES[userTier]} tier`,
        };
      }
      break;
    
    case 'sendAiMessage':
      if (currentCounts?.aiMessagesUsedToday !== undefined && currentCounts.aiMessagesUsedToday >= limits.maxAiMessagesPerDay) {
        return {
          allowed: false,
          reason: `You've reached the limit of ${limits.maxAiMessagesPerDay} AI messages per day for the ${TIER_NAMES[userTier]} tier`,
        };
      }
      break;
    
    case 'inviteUser':
      if (!limits.canInviteUsers) {
        return {
          allowed: false,
          reason: `Inviting users to organizations is not available in the ${TIER_NAMES[userTier]} tier`,
        };
      }
      break;
    
    case 'requestFeature':
      if (!limits.hasFeatureRequests) {
        return {
          allowed: false,
          reason: `Feature requests are only available in the ${TIER_NAMES.pro} tier`,
        };
      }
      break;
  }

  return { allowed: true };
}

export function shouldResetAiMessages(lastResetAt: Date): boolean {
  const now = new Date();
  const lastReset = new Date(lastResetAt);
  
  // Reset at midnight UTC
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastResetMidnight = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
  
  return todayMidnight > lastResetMidnight;
}