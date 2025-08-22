'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, RefreshCw, Users, Link } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/lib/types';

interface InviteManagerProps {
  organization: Organization;
  onInviteRefresh?: () => void;
}

export function InviteManager({ organization, onInviteRefresh }: InviteManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState(organization.invite_code);

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
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/refresh-invite`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh invite code');
      }

      const data = await response.json();
      setCurrentInviteCode(data.inviteCode);
      toast.success('Invite code refreshed successfully!');
      onInviteRefresh?.();
    } catch {
      toast.error('Failed to refresh invite code');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          Manage Invites
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Organization Invites</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
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
              <li>If they don't have an account, they'll be prompted to sign up</li>
              <li>After signing up/logging in, they'll automatically join this organization</li>
              <li>You can refresh the invite code anytime for security</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}