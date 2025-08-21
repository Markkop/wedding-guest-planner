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
import { toast } from 'sonner';
import type { Organization } from '@/lib/types';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  partner1_label: z.string().min(1, 'Partner 1 label is required'),
  partner1_initial: z.string().length(1, 'Must be a single character'),
  partner2_label: z.string().min(1, 'Partner 2 label is required'),
  partner2_initial: z.string().length(1, 'Must be a single character'),
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
  const [loading, setLoading] = useState(false);

  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      partner1_label: 'Bride',
      partner1_initial: 'B',
      partner2_label: 'Groom',
      partner2_initial: 'G',
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

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Create a new wedding project or join an existing one
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
                    {org.name}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {org.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="partner1_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner 1 Label</FormLabel>
                          <FormControl>
                            <Input placeholder="Bride" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="partner1_initial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner 1 Initial</FormLabel>
                          <FormControl>
                            <Input placeholder="B" maxLength={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="partner2_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner 2 Label</FormLabel>
                          <FormControl>
                            <Input placeholder="Groom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="partner2_initial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner 2 Initial</FormLabel>
                          <FormControl>
                            <Input placeholder="G" maxLength={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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