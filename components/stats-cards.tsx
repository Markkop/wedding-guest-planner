'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle } from 'lucide-react';
import { useGuests } from '@/lib/collaborative-guest-context';
import { CustomFieldStatsCards } from './custom-field-stats-cards';
import type { Organization } from '@/lib/types';


interface StatsCardsProps {
  organization: Organization;
}

export function StatsCards({ organization }: StatsCardsProps) {
  const { stats, guests } = useGuests();

  const categories = organization.configuration?.categories || [];
  const customFields = organization.configuration?.customFields || [];

  // Calculate aggregated counts for the new display format
  const listedCount = stats.byConfirmationStage?.['listed'] || 0;
  const invitedCount = stats.byConfirmationStage?.['invited'] || 0;
  const confirmedCount = (stats.byConfirmationStage?.['confirmed_1'] || 0) + 
                        (stats.byConfirmationStage?.['confirmed_2'] || 0) + 
                        (stats.byConfirmationStage?.['confirmed_3'] || 0);
  const declinedCount = stats.byConfirmationStage?.['declined'] || 0;

  return (
    <>
      {/* Custom Field Statistics Cards */}
      <CustomFieldStatsCards guests={guests} customFields={customFields} />
      
      {/* Standard Statistics Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
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
        
        {/* Invitations Card */}
        {organization.configuration?.confirmationStages?.enabled && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">Invitations</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {/* Listed - Gray */}
                <span style={{ color: '#6B7280' }}>{listedCount}</span>
                <span className="text-muted-foreground mx-1">/</span>
                
                {/* Invited - Yellow */}
                <span style={{ color: '#F59E0B' }}>{invitedCount}</span>
                <span className="text-muted-foreground mx-1">/</span>
                
                {/* All Confirmed stages combined - Green */}
                <span style={{ color: '#22C55E' }}>{confirmedCount}</span>
                <span className="text-muted-foreground mx-1">/</span>
                
                {/* Declined - Gray */}
                <span style={{ color: '#6B7280' }}>{declinedCount}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}