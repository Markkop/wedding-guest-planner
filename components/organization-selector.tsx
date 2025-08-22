'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Organization, EventTypePreset } from '@/lib/types';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  event_type: z.string().min(1, 'Event type is required'),
});

const joinOrgSchema = z.object({
  invite_code: z.string().min(1, 'Invite code is required'),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;
type JoinOrgForm = z.infer<typeof joinOrgSchema>;

interface OrganizationSelectorProps {
  onOrganizationSelect: (org: Organization) => void;
}

export function OrganizationSelector({ onOrganizationSelect }: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [eventPresets, setEventPresets] = useState<EventTypePreset[]>([]);
  const [loading, setLoading] = useState(false);

  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      event_type: 'wedding',
    },
  });

  const joinForm = useForm<JoinOrgForm>({
    resolver: zodResolver(joinOrgSchema),
    defaultValues: {
      invite_code: '',
    },
  });

  useEffect(() => {
    fetchOrganizations();
    fetchEventPresets();
  }, []);

  async function fetchOrganizations() {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (response.ok) {
        setOrganizations(data.organizations || []);
      }
    } catch {
      console.error('Failed to fetch organizations');
    }
  }

  async function fetchEventPresets() {
    try {
      const response = await fetch('/api/event-presets');
      const data = await response.json();
      if (response.ok) {
        setEventPresets(data.presets || []);
      }
    } catch {
      console.error('Failed to fetch event presets');
    }
  }

  async function onCreateOrg(data: CreateOrgForm) {
    setLoading(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Organization created successfully!');
        onOrganizationSelect(result.organization);
      } else {
        toast.error(result.error || 'Failed to create organization');
      }
    } catch {
      toast.error('Failed to create organization');
    } finally {
      setLoading(false);
    }
  }

  async function onJoinOrg(data: JoinOrgForm) {
    setLoading(true);
    try {
      const response = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Joined organization successfully!');
        onOrganizationSelect(result.organization);
      } else {
        toast.error(result.error || 'Failed to join organization');
      }
    } catch {
      toast.error('Failed to join organization');
    } finally {
      setLoading(false);
    }
  }

  const selectedEventType = createForm.watch('event_type');
  const selectedPreset = eventPresets.find(preset => preset.name === selectedEventType);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Create a new guest list project or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium">Your Organizations</h3>
              <div className="space-y-2">
                {organizations.map((org) => (
                  <Button
                    key={org.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onOrganizationSelect(org)}
                  >
                    <div className="flex flex-col items-start">
                      <span>{org.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {org.event_type} • {org.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="join">Join Existing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateOrg)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Sarah & John's Wedding" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventPresets.map((preset) => (
                              <SelectItem key={preset.name} value={preset.name}>
                                <div className="flex flex-col items-start">
                                  <span className="capitalize font-medium">{preset.name}</span>
                                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedPreset && (
                    <div className="rounded-md border p-4 bg-muted/50">
                      <h4 className="text-sm font-medium mb-2">Configuration Preview</h4>
                      <div className="text-xs space-y-1">
                        <div>
                          <strong>Categories:</strong>{' '}
                          {selectedPreset.default_config.categories.map(cat => cat.label).join(', ')}
                        </div>
                        <div>
                          <strong>Age Groups:</strong>{' '}
                          {selectedPreset.default_config.ageGroups.enabled 
                            ? selectedPreset.default_config.ageGroups.groups.map(age => age.label).join(', ')
                            : 'Disabled'
                          }
                        </div>
                        <div>
                          <strong>Food Preferences:</strong>{' '}
                          {selectedPreset.default_config.foodPreferences.enabled 
                            ? selectedPreset.default_config.foodPreferences.options.map(food => food.label).join(', ')
                            : 'Disabled'
                          }
                        </div>
                        <div>
                          <strong>Confirmation Stages:</strong>{' '}
                          {selectedPreset.default_config.confirmationStages.stages
                            .sort((a, b) => a.order - b.order)
                            .map(stage => stage.label).join(' → ')
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Organization'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="join">
              <Form {...joinForm}>
                <form onSubmit={joinForm.handleSubmit(onJoinOrg)} className="space-y-4">
                  <FormField
                    control={joinForm.control}
                    name="invite_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invite Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter invite code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Joining...' : 'Join Organization'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}