'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { EventConfigForm } from '@/components/event-config-form';
import type { Organization } from '@/lib/types';
import { LoadingContent } from '@/components/ui/loading-spinner';

interface SettingsDialogProps {
  organization: Organization;
  onSettingsChange?: () => void;
}

export function SettingsDialog({ organization, onSettingsChange }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState<Organization>(organization);
  const [loading, setLoading] = useState(false);

  // Update organization state when prop changes
  useEffect(() => {
    setCurrentOrganization(organization);
  }, [organization]);

  const handleConfigSave = async () => {
    setLoading(true);
    try {
      // Reload organization data to get updated configuration
      const response = await fetch('/api/organizations');
      const data = await response.json();
      
      if (data.organizations && data.organizations.length > 0) {
        const updatedOrg = data.organizations.find((org: Organization) => org.id === organization.id);
        if (updatedOrg) {
          setCurrentOrganization(updatedOrg);
        }
      }
      
      toast.success('Settings saved successfully!');
      onSettingsChange?.();
      
      // Close dialog after successful save
      setTimeout(() => {
        setIsOpen(false);
      }, 1000);
    } catch {
      toast.error('Failed to reload organization data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Manage Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Settings</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <LoadingContent text="Saving settings..." className="min-h-[200px]" />
          ) : (
            <EventConfigForm
              organizationId={currentOrganization.id}
              initialConfig={currentOrganization.configuration}
              initialEventType={currentOrganization.event_type}
              onSave={handleConfigSave}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}