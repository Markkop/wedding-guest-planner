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
import { LoadingContent, InlineSpinner } from '@/components/ui/loading-spinner';
import { useUser } from "@clerk/nextjs";

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
  const user = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [eventPresets, setEventPresets] = useState<EventTypePreset[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(true);
  const [debugLoading, setDebugLoading] = useState(false);

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
    setFetchingOrgs(true);
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (response.ok) {
        setOrganizations(data.organizations || []);
      }
    } catch {
      console.error('Failed to fetch organizations');
    } finally {
      setFetchingOrgs(false);
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
    setCreateLoading(true);
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
      setCreateLoading(false);
    }
  }

  async function onJoinOrg(data: JoinOrgForm) {
    setJoinLoading(true);
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
      setJoinLoading(false);
    }
  }

  async function debugTryDashboard() {
    setDebugLoading(true);
    console.group('🔍 DEBUG: Try Dashboard');
    
    try {
      // Step 1: Log environment info
      console.log('📊 Environment Info:', {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });

      // Step 2: Log current user info
      const clerkUserId = user.user?.id;
      const userEmail = user.user?.emailAddresses?.[0]?.emailAddress;
      console.log('👤 Current User:', {
        user: user.user ? {
          id: clerkUserId,
          email: userEmail,
          firstName: user.user.firstName,
          lastName: user.user.lastName,
          isSignedIn: !!user.user
        } : 'No user',
        clerkAuth: {
          hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        }
      });
      
      // Log Clerk User ID prominently for migration purposes
      if (clerkUserId) {
        console.log('🔑 Clerk User ID (for migration):', clerkUserId);
        console.log('📧 User Email:', userEmail);
      } else {
        console.warn('⚠️ No Clerk User ID found!');
      }

      // Step 3: Test API connectivity
      console.log('🌐 Testing API connectivity...');
      
      // Test organizations endpoint
      const orgResponse = await fetch('/api/organizations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Organizations API Response:', {
        status: orgResponse.status,
        statusText: orgResponse.statusText,
        headers: Object.fromEntries(orgResponse.headers.entries())
      });

      const orgData = await orgResponse.json();
      console.log('📄 Organizations Data:', orgData);

      // Step 4: Test event presets endpoint
      const presetsResponse = await fetch('/api/event-presets');
      const presetsData = await presetsResponse.json();
      console.log('🎭 Event Presets:', {
        status: presetsResponse.status,
        data: presetsData
      });

      // Step 5: Check current organizations state
      console.log('🏢 Current Organizations State:', {
        organizations: organizations,
        organizationsLength: organizations.length,
        fetchingOrgs: fetchingOrgs
      });

      // Step 6: Try to force-select an organization if any exist
      if (organizations.length > 0) {
        const firstOrg = organizations[0];
        console.log('🚀 Force selecting first organization:', firstOrg);
        
        setTimeout(() => {
          console.log('✅ Redirecting to dashboard with organization:', firstOrg.id);
          onOrganizationSelect(firstOrg);
        }, 2000);
        
        toast.success(`Debug: Found ${organizations.length} organizations. Redirecting to dashboard in 2 seconds...`);
      } else {
        // Step 7: Try to fetch organizations again
        console.log('🔄 No organizations found, retrying fetch...');
        
        const retryResponse = await fetch('/api/organizations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        const retryData = await retryResponse.json();
        console.log('🔄 Retry Organizations Response:', {
          status: retryResponse.status,
          data: retryData
        });

        if (retryData.organizations && retryData.organizations.length > 0) {
          console.log('🎉 Found organizations on retry!');
          setOrganizations(retryData.organizations);
          
          setTimeout(() => {
            console.log('✅ Redirecting to dashboard with first org from retry');
            onOrganizationSelect(retryData.organizations[0]);
          }, 2000);
          
          toast.success(`Debug: Found ${retryData.organizations.length} organizations on retry. Redirecting in 2 seconds...`);
        } else {
          console.log('❌ Still no organizations found');
          toast.error('Debug: No organizations found even after retry. Check console for details.');
        }
      }

    } catch (error) {
      console.error('💥 Debug Error:', error);
      toast.error('Debug failed. Check console for details.');
    } finally {
      console.groupEnd();
      setDebugLoading(false);
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
          {fetchingOrgs ? (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium">Your Organizations</h3>
              <LoadingContent text="Loading organizations..." className="py-4" />
            </div>
          ) : organizations.length > 0 ? (
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
          ) : null}

          {/* Clerk User ID Display */}
          {user.user?.id && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-xs font-medium text-blue-800 mb-1">🔑 Clerk User Information</h3>
              <p className="text-xs text-blue-700">
                <strong>User ID:</strong> <code className="bg-blue-100 px-1 rounded text-[10px]">{user.user.id}</code>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                <strong>Email:</strong> {user.user.emailAddresses?.[0]?.emailAddress || 'N/A'}
              </p>
            </div>
          )}

          {/* Debug Button */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🔧 Debug Mode</h3>
            <p className="text-xs text-yellow-700 mb-3">
              If you should have organizations but don't see them, click this button to debug the issue.
              Check your browser console for detailed logs.
            </p>
            <Button 
              onClick={debugTryDashboard} 
              disabled={debugLoading}
              variant="outline"
              size="sm"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              {debugLoading ? (
                <>
                  <InlineSpinner size="sm" className="mr-2" />
                  Debugging... Check Console
                </>
              ) : (
                '🔍 Debug & Try Dashboard'
              )}
            </Button>
          </div>

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
                  
                  <Button type="submit" className="w-full" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <InlineSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Organization'
                    )}
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
                  
                  <Button type="submit" className="w-full" disabled={joinLoading}>
                    {joinLoading ? (
                      <>
                        <InlineSpinner size="sm" className="mr-2" />
                        Joining...
                      </>
                    ) : (
                      'Join Organization'
                    )}
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