'use client';

import { useEffect, useState } from 'react';
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
  TableCell,
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
  DropdownMenuItem,
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
  organization: any;
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

  useEffect(() => {
    fetchGuests();
    const savedColumns = localStorage.getItem('visibleColumns');
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns));
    }
  }, [organizationId]);

  useEffect(() => {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  async function fetchGuests() {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/guests`);
      const data = await response.json();
      if (response.ok) {
        setGuests(data.guests || []);
      }
    } catch (error) {
      toast.error('Failed to fetch guests');
    }
  }

  async function handleAddGuest() {
    if (!newGuestName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGuestName }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setGuests([...guests, data.guest]);
        setNewGuestName('');
        toast.success('Guest added successfully');
      } else {
        toast.error(data.error || 'Failed to add guest');
      }
    } catch (error) {
      toast.error('Failed to add guest');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGuest(guestId: string, updates: Partial<Guest>) {
    try {
      console.log('Updating guest:', guestId, 'with updates:', updates);
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      console.log('Update response:', response.status, data);
      if (response.ok) {
        setGuests(guests.map(g => g.id === guestId ? { ...g, ...data.guest } : g));
        toast.success('Guest updated successfully');
      } else {
        toast.error(data.error || 'Failed to update guest');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update guest');
    }
  }

  async function handleDeleteGuest(guestId: string) {
    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setGuests(guests.filter(g => g.id !== guestId));
        toast.success('Guest deleted');
      } else {
        toast.error('Failed to delete guest');
      }
    } catch (error) {
      toast.error('Failed to delete guest');
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = guests.findIndex(g => g.id === active.id);
    const newIndex = guests.findIndex(g => g.id === over.id);
    
    const newGuests = arrayMove(guests, oldIndex, newIndex);
    setGuests(newGuests);
    
    try {
      await fetch(`/api/organizations/${organizationId}/guests/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestIds: newGuests.map(g => g.id) }),
      });
    } catch (error) {
      toast.error('Failed to save order');
      fetchGuests();
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