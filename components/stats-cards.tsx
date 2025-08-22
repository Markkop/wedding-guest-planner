'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle } from 'lucide-react';
import { useGuests } from '@/lib/guest-context';

interface CategoryConfig {
  id: string;
  label: string;
  initial: string;
  color: string;
}

interface ConfirmationStage {
  id: string;
  label: string;
  order: number;
  color?: string;
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
    stages: ConfirmationStage[];
  };
}

interface Organization {
  id: string;
  name: string;
  event_type: string;
  configuration: EventConfiguration;
}

interface StatsCardsProps {
  organization: Organization;
}

export function StatsCards({ organization }: StatsCardsProps) {
  const { stats } = useGuests();

  const categories = organization.configuration?.categories || [];
  const confirmationStages = organization.configuration?.confirmationStages?.stages || [];

  // Default colors for confirmation stages
  const getConfirmationColor = (stageId: string) => {
    switch (stageId) {
      case 'invited': return '#6B7280';    // Neutral/gray
      case 'pending': return '#F59E0B';    // Yellow
      case 'confirmed': return '#10B981';  // Green
      case 'declined': return '#EF4444';   // Red
      default: return '#6B7280';           // Default neutral
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Guests Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Guests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-1">
            {categories.map((category, index) => (
              <span key={category.id}>
                <span style={{ color: category.color }}>
                  {stats.byCategory[category.id] || 0}
                </span>
                {index < categories.length - 1 && (
                  <span className="text-muted-foreground mx-1">/</span>
                )}
              </span>
            ))}
            {categories.length > 0 && (
              <span className="text-muted-foreground ml-2">({stats.total})</span>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmations Card */}
      {organization.configuration?.confirmationStages?.enabled && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Invitations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {confirmationStages
                .sort((a, b) => a.order - b.order)
                .map((stage, index) => (
                  <span key={stage.id}>
                    <span style={{ color: stage.color || getConfirmationColor(stage.id) }}>
                      {stats.byConfirmationStage?.[stage.id] || 0}
                    </span>
                    {index < confirmationStages.length - 1 && (
                      <span className="text-muted-foreground mx-1">/</span>
                    )}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}