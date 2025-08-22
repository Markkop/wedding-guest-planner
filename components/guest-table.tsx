'use client';

import { useEffect, useState, useRef } from 'react';
import {
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useGuests } from '@/lib/guest-context';
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
import { TableRowSkeleton, InlineSpinner } from '@/components/ui/loading-spinner';

interface Guest {
  id: string;
  name: string;
  categories: string[];
  age_group?: string;
  food_preference?: string;
  confirmation_stage: string;
  custom_fields: Record<string, unknown>;
  display_order: number;
}

interface GuestTableProps {
  organizationId: string;
  organization: {
    id: string;
    name: string;
    event_type: string;
    configuration: {
      categories: Array<{
        id: string;
        label: string;
        initial: string;
        color: string;
      }>;
      ageGroups: {
        enabled: boolean;
        groups: Array<{
          id: string;
          label: string;
          minAge?: number;
        }>;
      };
      foodPreferences: {
        enabled: boolean;
        options: Array<{
          id: string;
          label: string;
        }>;
      };
      confirmationStages: {
        enabled: boolean;
        stages: Array<{
          id: string;
          label: string;
          order: number;
        }>;
      };
    };
  };
}

export function GuestTable({ organizationId, organization }: GuestTableProps) {
  const { 
    guests, 
    loading, 
    loadGuests, 
    addGuest, 
    updateGuest, 
    deleteGuest, 
    reorderGuests,
    moveGuestToEnd,
    setOrganization 
  } = useGuests();
  
  const [newGuestName, setNewGuestName] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    categories: true,
    age: organization.configuration?.ageGroups?.enabled ?? false,
    food: organization.configuration?.foodPreferences?.enabled ?? false,
    confirmations: organization.configuration?.confirmationStages?.enabled ?? false,
  });
  const [addingGuest, setAddingGuest] = useState(false);
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);

  useEffect(() => {
    setOrganization(organization);
    loadGuests(organizationId);
    const savedColumns = localStorage.getItem('visibleColumns');
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns));
    }
  }, [organizationId, organization, loadGuests, setOrganization]);

  useEffect(() => {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  async function handleAddGuest() {
    if (!newGuestName.trim()) return;
    
    setAddingGuest(true);
    try {
      await addGuest(newGuestName);
      setNewGuestName('');
    } finally {
      setAddingGuest(false);
    }
  }

  async function handleUpdateGuest(guestId: string, updates: Partial<Guest>) {
    await updateGuest(guestId, updates);
  }

  async function handleDeleteGuest(guestId: string) {
    await deleteGuest(guestId);
  }

  // Setup global drag monitor
  useEffect(() => {
    const cleanup = monitorForElements({
      onDragStart() {
        // Drag started
      },
      onDrop() {
        // Drag ended
      },
    });
    return cleanup;
  }, []);

  async function handleReorder(fromIndex: number, toIndex: number) {
    await reorderGuests(fromIndex, toIndex);
  }

  async function handleMoveToEnd(guestId: string) {
    await moveGuestToEnd(guestId);
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
                    checked={visibleColumns.categories}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, categories: !!checked })
                    }
                  />
                  <span className="text-sm">Categories</span>
                </label>
                {organization.configuration?.ageGroups?.enabled && (
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={visibleColumns.age}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, age: !!checked })
                      }
                    />
                    <span className="text-sm">Age</span>
                  </label>
                )}
                {organization.configuration?.foodPreferences?.enabled && (
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={visibleColumns.food}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, food: !!checked })
                      }
                    />
                    <span className="text-sm">Food Preference</span>
                  </label>
                )}
                {organization.configuration?.confirmationStages?.enabled && (
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={visibleColumns.confirmations}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, confirmations: !!checked })
                      }
                    />
                    <span className="text-sm">Confirmations</span>
                  </label>
                )}
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
            {visibleColumns.categories && <TableHead className="w-32">Categories</TableHead>}
            {visibleColumns.age && organization.configuration?.ageGroups?.enabled && <TableHead className="w-24">Age</TableHead>}
            {visibleColumns.food && organization.configuration?.foodPreferences?.enabled && <TableHead className="w-32">Food</TableHead>}
            {visibleColumns.confirmations && organization.configuration?.confirmationStages?.enabled && <TableHead className="w-32">Status</TableHead>}
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={tableBodyRef}>
          {loading ? (
            <>
              <TableRowSkeleton columns={
                3 + // base columns (drag, #, name)
                (visibleColumns.categories ? 1 : 0) +
                (visibleColumns.age && organization.configuration?.ageGroups?.enabled ? 1 : 0) +
                (visibleColumns.food && organization.configuration?.foodPreferences?.enabled ? 1 : 0) +
                (visibleColumns.confirmations && organization.configuration?.confirmationStages?.enabled ? 1 : 0) +
                1 // actions column
              } />
              <TableRowSkeleton columns={
                3 + // base columns (drag, #, name)
                (visibleColumns.categories ? 1 : 0) +
                (visibleColumns.age && organization.configuration?.ageGroups?.enabled ? 1 : 0) +
                (visibleColumns.food && organization.configuration?.foodPreferences?.enabled ? 1 : 0) +
                (visibleColumns.confirmations && organization.configuration?.confirmationStages?.enabled ? 1 : 0) +
                1 // actions column
              } />
              <TableRowSkeleton columns={
                3 + // base columns (drag, #, name)
                (visibleColumns.categories ? 1 : 0) +
                (visibleColumns.age && organization.configuration?.ageGroups?.enabled ? 1 : 0) +
                (visibleColumns.food && organization.configuration?.foodPreferences?.enabled ? 1 : 0) +
                (visibleColumns.confirmations && organization.configuration?.confirmationStages?.enabled ? 1 : 0) +
                1 // actions column
              } />
            </>
          ) : guests.length === 0 ? (
            <tr>
              <td 
                colSpan={
                  3 + // base columns
                  (visibleColumns.categories ? 1 : 0) +
                  (visibleColumns.age && organization.configuration?.ageGroups?.enabled ? 1 : 0) +
                  (visibleColumns.food && organization.configuration?.foodPreferences?.enabled ? 1 : 0) +
                  (visibleColumns.confirmations && organization.configuration?.confirmationStages?.enabled ? 1 : 0) +
                  1 // actions column
                }
                className="text-center py-8 text-muted-foreground"
              >
                No guests added yet. Add your first guest below.
              </td>
            </tr>
          ) : (
            guests.map((guest, index) => (
              <SortableRow
                key={guest.id}
                guest={guest}
                index={index + 1}
                guestIndex={index}
                visibleColumns={visibleColumns}
                organization={organization}
                onUpdate={handleUpdateGuest}
                onDelete={handleDeleteGuest}
                onReorder={handleReorder}
                onMoveToEnd={handleMoveToEnd}
              />
            ))
          )}
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
          <Button onClick={handleAddGuest} disabled={addingGuest || !newGuestName.trim()}>
            {addingGuest ? (
              <InlineSpinner size="sm" className="mr-2" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {addingGuest ? 'Adding...' : 'Add Guest'}
          </Button>
        </div>
      </div>
    </div>
  );
}