'use client';

import { useUser } from '@stackframe/stack';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Crown, Calendar, MessageSquare } from 'lucide-react';
import { TierType } from '@/lib/tiers';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  tier: TierType;
  aiMessagesUsedToday: number;
  isSuperAdmin: boolean;
  createdAt: Date;
  organizationCount: number;
}

interface OrganizationData {
  id: string;
  name: string;
  eventType: string;
  adminEmail: string;
  memberCount: number;
  guestCount: number;
  createdAt: Date;
}

export default function SuperAdminPage() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch('/api/super-admin/check');
        const data = await response.json();
        
        if (response.ok && data.isSuperAdmin) {
          setIsSuperAdmin(true);
          await loadData();
        } else {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdmin();
  }, [user]);

  const loadData = async () => {
    try {
      const [usersResponse, orgsResponse] = await Promise.all([
        fetch('/api/super-admin/users'),
        fetch('/api/super-admin/organizations'),
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
      }

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(orgsData.organizations);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const updateUserTier = async (userId: string, newTier: TierType) => {
    try {
      const response = await fetch(`/api/super-admin/users/${userId}/tier`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
      }
    } catch (error) {
      console.error('Error updating user tier:', error);
    }
  };

  const getTierColor = (tier: TierType) => {
    switch (tier) {
      case 'free': return 'default';
      case 'plus': return 'secondary';
      case 'pro': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please sign in to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. Super admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Super Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and organizations</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + org.guestCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Messages Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + user.aiMessagesUsedToday, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user tiers and view usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {user.name || user.email}
                        </span>
                        {user.isSuperAdmin && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Crown className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        )}
                        <Badge variant={getTierColor(user.tier)}>
                          {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>AI messages today: {user.aiMessagesUsedToday}</span>
                        <span>Organizations: {user.organizationCount}</span>
                        <span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.tier}
                        onValueChange={(newTier: TierType) => updateUserTier(user.id, newTier)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="plus">Plus</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>
                View all organizations and their statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map(org => (
                  <div key={org.id} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{org.name}</h3>
                          <Badge variant="outline">{org.eventType}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {org.guestCount} guests
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Admin: {org.adminEmail}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Members: {org.memberCount}</span>
                        <span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(org.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}