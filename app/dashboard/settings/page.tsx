'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  useUser({ or: 'redirect' });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    partner1_label: '',
    partner1_initial: '',
    partner2_label: '', 
    partner2_initial: ''
  });

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
        setSettings({
          name: org.name || '',
          partner1_label: org.partner1_label || '',
          partner1_initial: org.partner1_initial || '',
          partner2_label: org.partner2_label || '',
          partner2_initial: org.partner2_initial || ''
        });
      }
    } catch {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!organization) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        toast.success('Settings saved successfully');
        router.push('/dashboard');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Wedding Settings</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wedding Details</CardTitle>
              <CardDescription>Configure your wedding information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Wedding Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  placeholder="Our Wedding 2025"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partner Configuration</CardTitle>
              <CardDescription>Customize how partners are displayed in guest categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner1_label">Partner 1 Label</Label>
                  <Input
                    id="partner1_label"
                    value={settings.partner1_label}
                    onChange={(e) => setSettings({ ...settings, partner1_label: e.target.value })}
                    placeholder="Bride"
                  />
                </div>
                <div>
                  <Label htmlFor="partner1_initial">Partner 1 Initial</Label>
                  <Input
                    id="partner1_initial"
                    value={settings.partner1_initial}
                    onChange={(e) => setSettings({ ...settings, partner1_initial: e.target.value.charAt(0).toUpperCase() })}
                    placeholder="B"
                    maxLength={1}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner2_label">Partner 2 Label</Label>
                  <Input
                    id="partner2_label"
                    value={settings.partner2_label}
                    onChange={(e) => setSettings({ ...settings, partner2_label: e.target.value })}
                    placeholder="Groom"
                  />
                </div>
                <div>
                  <Label htmlFor="partner2_initial">Partner 2 Initial</Label>
                  <Input
                    id="partner2_initial"
                    value={settings.partner2_initial}
                    onChange={(e) => setSettings({ ...settings, partner2_initial: e.target.value.charAt(0).toUpperCase() })}
                    placeholder="G"
                    maxLength={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}