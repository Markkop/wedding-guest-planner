'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Heart } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  partner1_label?: string;
  partner1_initial?: string;
  partner2_label?: string;
  partner2_initial?: string;
}

interface StatsCardsProps {
  organizationId: string;
  organization: Organization;
}

export function StatsCards({ organizationId, organization }: StatsCardsProps) {
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    partner1_count: 0,
    partner2_count: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch {
    }
  }, [organizationId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const confirmedPercentage = stats.total > 0 
    ? Math.round((stats.confirmed / stats.total) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmed Guests</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.confirmed}</div>
          <p className="text-xs text-muted-foreground">{confirmedPercentage}% confirmed</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {organization.partner1_label} ({organization.partner1_initial})
          </CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.partner1_count}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {organization.partner2_label} ({organization.partner2_initial})
          </CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.partner2_count}</div>
        </CardContent>
      </Card>
    </div>
  );
}