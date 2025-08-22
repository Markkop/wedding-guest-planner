'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useDemoGuests } from '@/lib/demo-guest-context';

export function DemoStatsCards() {
  const { stats, organization } = useDemoGuests();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            people invited
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}% confirmed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{stats.invited}</div>
          <p className="text-xs text-muted-foreground">
            awaiting response
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Declined</CardTitle>
          <UserX className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
          <p className="text-xs text-muted-foreground">
            unable to attend
          </p>
        </CardContent>
      </Card>
      
      {/* Category breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">Guest Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {organization.configuration.categories.map(category => (
              <Badge 
                key={category.id} 
                variant="outline"
                className="px-3 py-1"
                style={{ borderColor: category.color }}
              >
                <span 
                  className="mr-2 h-2 w-2 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                {category.label}: {stats.byCategory[category.id] || 0}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}