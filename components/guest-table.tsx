'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchGuests = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/guests`);
      const data = await response.json();
      if (response.ok) {
        setGuests(data.guests || []);
      }
    } catch {
      toast.error('Failed to fetch guests');
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
      organization_id: organizationId,
      category: [],
      age_group: [],
      food_preference: [],
      confirmations: {
        save_the_date: false,
        invitation: false,
        attendance: false
      },
      order_index: guests.length
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
    } catch {
      // Revert on failure
      setGuests(prev => prev.filter(g => g.id !== tempId));
      setNewGuestName(newGuest.name);
      toast.error('Failed to add guest');
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
    } catch {
      // Revert on failure
      setGuests(prev => prev.map(g => g.id === guestId ? originalGuest : g));
      toast.error('Failed to update guest');
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
        // Revert on failure - restore guest at original position
        setGuests(prev => {
          const newGuests = [...prev];
          newGuests.splice(guestIndex, 0, guestToDelete);
          return newGuests;
        });
        toast.error('Failed to delete guest');
      }
    } catch {
      // Revert on failure - restore guest at original position
      setGuests(prev => {
        const newGuests = [...prev];
        newGuests.splice(guestIndex, 0, guestToDelete);
        return newGuests;
      });
      toast.error('Failed to delete guest');
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = guests.findIndex(g => g.id === active.id);
    const newIndex = guests.findIndex(g => g.id === over.id);
    
    // Store original order for rollback
    const originalGuests = [...guests];
    
    // Optimistic update - reorder immediately
    const newGuests = arrayMove(guests, oldIndex, newIndex);
    setGuests(newGuests);
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/guests/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestIds: newGuests.map(g => g.id) }),
      });
      
      if (!response.ok) {
        // Revert on failure
        setGuests(originalGuests);
        toast.error('Failed to save order');
      }
    } catch {
      // Revert on failure
      setGuests(originalGuests);
      toast.error('Failed to save order');
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
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
          <SortableContext
            items={guests.map(g => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {guests.map((guest, index) => (
                <SortableRow
                  key={guest.id}
                  guest={guest}
                  index={index + 1}
                  visibleColumns={visibleColumns}
                  organization={organization}
                  onUpdate={handleUpdateGuest}
                  onDelete={handleDeleteGuest}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
      
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