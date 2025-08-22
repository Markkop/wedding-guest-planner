'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SortableRow } from './sortable-row';
import { toast } from 'sonner';
import { Plus, Settings } from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  category: 'partner1' | 'partner2';
  age_group: 'adult' | '7years' | '11years';
  food_preference: 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free';
  confirmation_stage: number;
  declined: boolean;
  display_order: number;
}

interface GuestTableProps {
  organizationId: string;
  organization: {
    id: string;
    name: string;
    partner1_label?: string;
    partner1_initial?: string;
    partner2_label?: string;
    partner2_initial?: string;
  };
}

export function GuestTable({ organizationId, organization }: GuestTableProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    age: true,
    food: true,
    confirmations: true,
  });
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);

  const fetchGuests = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/guests`);
      const data = await response.json();
      if (response.ok) {
        setGuests(data.guests || []);
      } else {
        toast.error(data.error || 'Failed to fetch guests');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch guests');
    }
  }, [organizationId]);

  useEffect(() => {
    fetchGuests();
    const savedColumns = localStorage.getItem('visibleColumns');
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns));
    }
  }, [organizationId, fetchGuests]);

  useEffect(() => {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  async function handleAddGuest() {
    if (!newGuestName.trim()) return;
    
    // Optimistic update - add guest immediately
    const tempId = `temp-${Date.now()}`;
    const newGuest: Guest = {
      id: tempId,
      name: newGuestName,
      category: 'partner1',
      age_group: 'adult',
      food_preference: 'none',
      confirmation_stage: 0,
      declined: false,
      display_order: guests.length
    };
    
    setGuests([...guests, newGuest]);
    setNewGuestName('');
    setLoading(true);
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGuest.name }),
      });
      
      const data = await response.json();
      if (response.ok) {
        // Replace temp guest with real one from server
        setGuests(prev => prev.map(g => g.id === tempId ? data.guest : g));
      } else {
        // Revert on failure
        setGuests(prev => prev.filter(g => g.id !== tempId));
        setNewGuestName(newGuest.name);
        toast.error(data.error || 'Failed to add guest');
      }
    } catch (error) {
      // Revert on failure
      setGuests(prev => prev.filter(g => g.id !== tempId));
      setNewGuestName(newGuest.name);
      toast.error(error instanceof Error ? error.message : 'Failed to add guest');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGuest(guestId: string, updates: Partial<Guest>) {
    // Store original guest for rollback
    const originalGuest = guests.find(g => g.id === guestId);
    if (!originalGuest) return;
    
    // Optimistic update - update immediately
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, ...updates } : g));
    
    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      if (response.ok) {
        // Update with server response
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, ...data.guest } : g));
      } else {
        // Revert on failure
        setGuests(prev => prev.map(g => g.id === guestId ? originalGuest : g));
        toast.error(data.error || 'Failed to update guest');
      }
    } catch (error) {
      // Revert on failure
      setGuests(prev => prev.map(g => g.id === guestId ? originalGuest : g));
      toast.error(error instanceof Error ? error.message : 'Failed to update guest');
    }
  }

  async function handleDeleteGuest(guestId: string) {
    // Store guest for rollback
    const guestToDelete = guests.find(g => g.id === guestId);
    const guestIndex = guests.findIndex(g => g.id === guestId);
    if (!guestToDelete) return;
    
    // Optimistic update - remove immediately
    setGuests(prev => prev.filter(g => g.id !== guestId));
    
    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        // Revert on failure - restore guest at original position
        setGuests(prev => {
          const newGuests = [...prev];
          newGuests.splice(guestIndex, 0, guestToDelete);
          return newGuests;
        });
        toast.error(data.error || 'Failed to delete guest');
      }
    } catch (error) {
      // Revert on failure - restore guest at original position
      setGuests(prev => {
        const newGuests = [...prev];
        newGuests.splice(guestIndex, 0, guestToDelete);
        return newGuests;
      });
      toast.error(error instanceof Error ? error.message : 'Failed to delete guest');
    }
  }

  // Setup global drag monitor
  useEffect(() => {
    const cleanup = monitorForElements({
      onDragStart() {
        setIsDragging(true);
      },
      onDrop() {
        setIsDragging(false);
      },
    });
    return cleanup;
  }, []);

  async function handleReorder(fromIndex: number, toIndex: number) {
    // Store original order for rollback
    const originalGuests = [...guests];
    
    // Optimistic update - reorder immediately
    const newGuests = reorder({
      list: guests,
      startIndex: fromIndex,
      finishIndex: toIndex,
    });
    setGuests(newGuests);
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/guests/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestIds: newGuests.map(g => g.id) }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        // Revert on failure
        setGuests(originalGuests);
        toast.error(data.error || 'Failed to save order');
      }
    } catch (error) {
      // Revert on failure
      setGuests(originalGuests);
      toast.error(error instanceof Error ? error.message : 'Failed to save order');
    }
  }

  async function handleMoveToEnd(guestId: string) {
    // Find the guest to move
    const guestIndex = guests.findIndex(g => g.id === guestId);
    if (guestIndex === -1) return;
    
    // If already at the end, do nothing
    if (guestIndex === guests.length - 1) return;
    
    // Store original order for rollback
    const originalGuests = [...guests];
    
    // Optimistic update - move guest to end immediately
    const guestToMove = guests[guestIndex];
    const newGuests = [
      ...guests.slice(0, guestIndex),
      ...guests.slice(guestIndex + 1),
      guestToMove
    ];
    setGuests(newGuests);
    
    try {
      // Use the reorder endpoint with the new guest order
      const response = await fetch(`/api/organizations/${organizationId}/guests/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestIds: newGuests.map(g => g.id) }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        // Revert on failure
        setGuests(originalGuests);
        toast.error(data.error || 'Failed to move guest to end');
      }
    } catch (error) {
      // Revert on failure
      setGuests(originalGuests);
      console.error('Move to end error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to move guest to end');
    }
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Guest List</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={visibleColumns.category}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, category: !!checked })
                    }
                  />
                  <span className="text-sm">Category</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={visibleColumns.age}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, age: !!checked })
                    }
                  />
                  <span className="text-sm">Age</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={visibleColumns.food}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, food: !!checked })
                    }
                  />
                  <span className="text-sm">Food Preference</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={visibleColumns.confirmations}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, confirmations: !!checked })
                    }
                  />
                  <span className="text-sm">Confirmations</span>
                </label>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            {visibleColumns.category && <TableHead className="w-24">Category</TableHead>}
            {visibleColumns.age && <TableHead className="w-24">Age</TableHead>}
            {visibleColumns.food && <TableHead className="w-32">Food</TableHead>}
            {visibleColumns.confirmations && <TableHead className="w-32">Confirmations</TableHead>}
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={tableBodyRef}>
          {guests.map((guest, index) => (
            <SortableRow
              key={guest.id}
              guest={guest}
              index={index + 1}
              guestIndex={index}
              visibleColumns={visibleColumns}
              organization={organization}
              isDragging={isDragging}
              onUpdate={handleUpdateGuest}
              onDelete={handleDeleteGuest}
              onReorder={handleReorder}
              onMoveToEnd={handleMoveToEnd}
            />
          ))}
        </TableBody>
      </Table>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add new guest..."
            value={newGuestName}
            onChange={(e) => setNewGuestName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
            disabled={loading}
          />
          <Button onClick={handleAddGuest} disabled={loading || !newGuestName.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>
    </div>
  );
}