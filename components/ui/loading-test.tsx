'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LoadingSpinner, 
  InlineSpinner, 
  CardSkeleton, 
  TableRowSkeleton, 
  LoadingOverlay, 
  LoadingContent 
} from './loading-spinner';

export function LoadingTest() {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Loading Components Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Loading Spinners */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Loading Spinners</h3>
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
              <LoadingSpinner size="xl" />
            </div>
          </div>

          {/* Inline Spinners */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Inline Spinners</h3>
            <div className="flex items-center gap-4">
              <Button disabled>
                <InlineSpinner size="sm" className="mr-2" />
                Loading...
              </Button>
              <Button disabled>
                <InlineSpinner size="md" className="mr-2" />
                Saving...
              </Button>
            </div>
          </div>

          {/* Loading with Text */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Loading with Text</h3>
            <LoadingSpinner size="md" text="Loading data..." />
          </div>

          {/* Card Skeletons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Card Skeletons</h3>
            <div className="grid grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>

          {/* Table Row Skeletons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Table Row Skeletons</h3>
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-2">#</th>
                  <th className="border border-gray-200 p-2">Name</th>
                  <th className="border border-gray-200 p-2">Email</th>
                  <th className="border border-gray-200 p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
              </tbody>
            </table>
          </div>

          {/* Loading Content */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Loading Content</h3>
            <div className="border border-gray-200 rounded-lg h-32">
              <LoadingContent text="Loading content area..." />
            </div>
          </div>

          {/* Loading Overlay */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Loading Overlay</h3>
            <Button onClick={() => setShowOverlay(true)}>
              Show Loading Overlay
            </Button>
            {showOverlay && (
              <LoadingOverlay text="Processing request..." />
            )}
          </div>

        </CardContent>
      </Card>

      {/* Close overlay button (for demo) */}
      {showOverlay && (
        <Button 
          onClick={() => setShowOverlay(false)}
          className="fixed top-4 right-4 z-50"
        >
          Close Overlay
        </Button>
      )}
    </div>
  );
}