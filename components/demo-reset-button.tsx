'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useDemoGuests } from '@/lib/demo-guest-context';

export function DemoResetButton() {
  const { resetDemo } = useDemoGuests();
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={resetDemo}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      <RotateCcw className="mr-2 h-4 w-4" />
      Reset Demo
    </Button>
  );
}