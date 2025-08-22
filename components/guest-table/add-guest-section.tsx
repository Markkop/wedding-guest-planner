'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { InlineSpinner } from '@/components/ui/loading-spinner';

interface AddGuestSectionProps {
  onAddGuest: (name: string) => Promise<void>;
  loading: boolean;
}

export function AddGuestSection({ onAddGuest, loading }: AddGuestSectionProps) {
  const [newGuestName, setNewGuestName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddGuest = async () => {
    if (!newGuestName.trim()) return;
    
    setIsAdding(true);
    try {
      await onAddGuest(newGuestName);
      setNewGuestName('');
      // Keep focus on the input after adding
      inputRef.current?.focus();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Add new guest..."
          value={newGuestName}
          onChange={(e) => setNewGuestName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
          disabled={loading}
        />
        <Button 
          onClick={handleAddGuest} 
          disabled={isAdding || !newGuestName.trim()}
        >
          {isAdding ? (
            <InlineSpinner size="sm" className="mr-2" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAdding ? 'Adding...' : 'Add Guest'}
        </Button>
      </div>
    </div>
  );
}