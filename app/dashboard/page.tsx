'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@stackframe/stack';
import { GuestTable } from '@/components/guest-table';
import { StatsCards } from '@/components/stats-cards';
import { OrganizationSelector } from '@/components/organization-selector';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { InviteManager } from '@/components/invite-manager';
import { SettingsDialog } from '@/components/settings-dialog';
import { ExportDialog } from '@/components/export-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import type { Organization } from '@/lib/types';
import { LoadingContent } from '@/components/ui/loading-spinner';

export default function DashboardPage() {
  const user = useUser({ or: 'redirect' });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrganizations = useCallback(async () => {
    try {
      const orgsResponse = await fetch('/api/organizations');
      const orgsData = await orgsResponse.json();
      
      if (orgsData.organizations && orgsData.organizations.length > 0) {
        setOrganization(orgsData.organizations[0]);
      }
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user, loadOrganizations]);

  async function handleLogout() {
    try {
      await user.signOut();
      window.location.href = '/login';
    } catch {
      toast.error('Failed to logout');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingContent text="Loading dashboard..." className="min-h-screen" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Welcome, {user?.displayName || user?.primaryEmail}</h1>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
          
          <OrganizationSelector onOrganizationSelect={setOrganization} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <OrganizationSwitcher 
              currentOrganization={organization}
              onOrganizationChange={setOrganization}
            />
          </div>
          <div className="flex gap-2">
            {organization.role === 'admin' && (
              <>
                <InviteManager 
                  organization={organization} 
                  onInviteRefresh={loadOrganizations}
                />
                <SettingsDialog 
                  organization={organization}
                  onSettingsChange={loadOrganizations}
                />
                <ExportDialog 
                  organization={organization}
                  onDataChange={loadOrganizations}
                />
              </>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <StatsCards organizationId={organization.id} organization={organization} />
        
        <div className="mt-8">
          <GuestTable organizationId={organization.id} organization={organization} />
        </div>
      </div>
    </div>
  );
}