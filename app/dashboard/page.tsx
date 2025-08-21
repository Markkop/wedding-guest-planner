'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GuestTable } from '@/components/guest-table';
import { StatsCards } from '@/components/stats-cards';
import { OrganizationSelector } from '@/components/organization-selector';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut, Settings } from 'lucide-react';
import type { User, Organization } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (!response.ok) {
        router.push('/login');
        return;
      }
      
      setUser(data.user);
      
      // Get user organizations
      const orgsResponse = await fetch('/api/organizations');
      const orgsData = await orgsResponse.json();
      
      if (orgsData.organizations && orgsData.organizations.length > 0) {
        setOrganization(orgsData.organizations[0]);
      }
    } catch {
      toast.error('Failed to load user data');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Welcome, {user?.name || user?.email}</h1>
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
          <div>
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            <p className="text-sm text-gray-600">Invite Code: {organization.invite_code}</p>
          </div>
          <div className="flex gap-2">
            {organization.role === 'admin' && (
              <Button onClick={() => router.push('/dashboard/settings')} variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
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