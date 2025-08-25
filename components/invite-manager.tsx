'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Users, Link, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/lib/types';
import type { TierType } from '@/lib/tiers';

interface InviteManagerProps {
  organization: Organization;
  onInviteRefresh?: () => void;
}

export function InviteManager({ organization, onInviteRefresh }: InviteManagerProps) {
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState(organization.invite_code);
  const [userTier, setUserTier] = useState<TierType>('free');
  const [canInvite, setCanInvite] = useState(true);

  useEffect(() => {
    const checkInvitePermission = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/user/tier-info');
        if (response.ok) {
          const data = await response.json();
          setUserTier(data.tier);
          setCanInvite(data.tier !== 'free');
        }
      } catch (error) {
        console.error('Error checking user tier:', error);
      }
    };

    checkInvitePermission();
  }, [user]);

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${currentInviteCode}`;

  const copyInviteUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied to clipboard!');
    } catch {
      toast.error('Failed to copy invite link');
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(currentInviteCode);
      toast.success('Invite code copied to clipboard!');
    } catch {
      toast.error('Failed to copy invite code');
    }
  };

  const refreshInviteCode = async () => {
    if (!canInvite) {
      toast.error('Upgrade to Plus or Pro to invite collaborators');
      return;
    }
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/refresh-invite`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh invite code');
      }

      const data = await response.json();
      setCurrentInviteCode(data.inviteCode);
      toast.success('Invite code refreshed successfully!');
      onInviteRefresh?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to refresh invite code';
      toast.error(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canInvite}>
          {canInvite ? (
            <Users className="sm:mr-2 h-4 w-4" />
          ) : (
            <Lock className="sm:mr-2 h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {canInvite ? 'Invites' : 'Invites (Pro)'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Organization Invites
            {!canInvite && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Requires Upgrade
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
          {!canInvite && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-2">🔒 Invite feature requires an upgrade</p>
                  <p>You&apos;re currently on the <Badge variant="outline">{userTier}</Badge> plan. Upgrade to Plus or Pro to invite collaborators to your organization.</p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link className="h-5 w-5" />
                Invite Link
              </CardTitle>
              <CardDescription>
                Share this link to invite people to join {organization.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-url">Invite URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-url"
                    value={inviteUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyInviteUrl} variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-code"
                    value={currentInviteCode}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyInviteCode} variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={refreshInviteCode} 
                  variant="outline" 
                  disabled={isRefreshing}
                  className="w-full"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Generate New Invite Code'}
                </Button>
              </div>
            </CardContent>
          </Card>


          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>How it works:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Share the invite link with people you want to join</li>
              <li>If they don&apos;t have an account, they&apos;ll be prompted to sign up</li>
              <li>After signing up/logging in, they&apos;ll automatically join this organization</li>
              <li>You can refresh the invite code anytime for security</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}