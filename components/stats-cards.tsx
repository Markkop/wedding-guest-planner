'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Heart } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/loading-spinner';

interface CategoryConfig {
  id: string;
  label: string;
  initial: string;
  color: string;
}

interface EventConfiguration {
  categories: CategoryConfig[];
  ageGroups: {
    enabled: boolean;
    groups: Array<{ id: string; label: string; minAge?: number; }>;
  };
  foodPreferences: {
    enabled: boolean;
    options: Array<{ id: string; label: string; }>;
  };
  confirmationStages: {
    enabled: boolean;
    stages: Array<{ id: string; label: string; order: number; }>;
  };
}

interface Organization {
  id: string;
  name: string;
  event_type: string;
  configuration: EventConfiguration;
}

interface StatsCardsProps {
  organizationId: string;
  organization: Organization;
}

interface GuestStatistics {
  total: number;
  confirmed: number;
  invited: number;
  declined: number;
  byCategory: Record<string, number>;
  byConfirmationStage: Record<string, number>;
}

export function StatsCards({ organizationId, organization }: StatsCardsProps) {
  const [stats, setStats] = useState<GuestStatistics>({
    total: 0,
    confirmed: 0,
    invited: 0,
    declined: 0,
    byCategory: {},
    byConfirmationStage: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const confirmedPercentage = stats.total > 0 
    ? Math.round((stats.confirmed / stats.total) * 100) 
    : 0;

  const categories = organization.configuration?.categories || [];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        {categories.map((category) => (
          <CardSkeleton key={category.id} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
      
      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {category.label} ({category.initial})
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" style={{ color: category.color }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory[category.id] || 0}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}