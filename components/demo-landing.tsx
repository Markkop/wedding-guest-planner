'use client';

import { DemoGuestProvider } from '@/lib/demo-guest-context';
import { DemoGuestTable } from './demo-guest-table';
import { DemoStatsCards } from './demo-stats-cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MousePointer } from 'lucide-react';

function DemoContent() {
  return (
    <DemoGuestProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Demo Header */}
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              Interactive Demo
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Wedding Guest Management Made Easy
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
              Experience our powerful guest management features. Try dragging guests around, 
              editing names, changing categories, and adding new guests!
            </p>
            
            {/* Demo Instructions */}
            <Card className="max-w-4xl mx-auto mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Try These Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Drag & Drop:</strong> Drag guests by the grip handle to reorder them
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Quick Edit:</strong> Click the edit icon to rename guests
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Categories:</strong> Click B/G/M buttons to assign guests to different sides
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Status:</strong> Click confirmation status to cycle between invited/confirmed/declined
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Add Guests:</strong> Type a name and click &ldquo;Add Guest&rdquo; to add new people
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Settings:</strong> Use the gear icon to show/hide columns
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demo Stats */}
          <div className="mb-8">
            <DemoStatsCards />
          </div>
          
          {/* Demo Guest Table */}
          <div className="mb-8">
            <DemoGuestTable />
          </div>

          {/* Demo Footer */}
          <div className="text-center">
            <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-3">Ready to manage your own event?</h3>
              <p className="text-gray-600 mb-4">
                Create your free account and start planning your wedding, party, or any special event!
              </p>
              <div className="flex gap-3 justify-center">
                <Button size="lg" className="px-8">
                  Get Started Free
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoGuestProvider>
  );
}

export function DemoLanding() {
  return <DemoContent />;
}

