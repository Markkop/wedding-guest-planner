'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { EventConfigForm } from '@/components/event-config-form';
import type { Organization } from '@/lib/types';
import { LoadingContent } from '@/components/ui/loading-spinner';

export default function SettingsPage() {
  const router = useRouter();
  useUser({ or: 'redirect' });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      
      if (data.organizations && data.organizations.length > 0) {
        const org = data.organizations[0];
        setOrganization(org);
      }
    } catch {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  function handleConfigSave() {
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingContent text="Loading settings..." className="min-h-screen" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>No organization found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Event Settings</h1>
            <p className="text-muted-foreground">Configure your {organization.event_type} event</p>
          </div>
        </div>

        <EventConfigForm
          organizationId={organization.id}
          initialConfig={organization.configuration}
          initialEventType={organization.event_type}
          onSave={handleConfigSave}
        />
      </div>
    </div>
  );
}