"use client";

import { useEffect, useState, useRef } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useDemoGuests } from "@/lib/demo-guest-context";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableRow } from "./sortable-row";
import { ColumnSettings } from "./guest-table/column-settings";
import { AddGuestSection } from "./guest-table/add-guest-section";
import { TableLoading } from "./guest-table/table-loading";
import { EmptyState } from "./guest-table/empty-state";
import { useColumnCount } from "@/lib/hooks/use-column-count";
import type { VisibleColumns, Guest } from "@/lib/types";

export function DemoGuestTable() {
  const {
    guests,
    loading,
    organization,
    addGuest,
    cloneGuest,
    updateGuest,
    deleteGuest,
    reorderGuests,
    moveGuestToEnd,
    moveGuestAboveListedDeclined,
  } = useDemoGuests();

  const [addingGuest, setAddingGuest] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    categories: true,
    age: organization.configuration?.ageGroups?.enabled ?? false,
    food: organization.configuration?.foodPreferences?.enabled ?? false,
    confirmations:
      organization.configuration?.confirmationStages?.enabled ?? false,
  });
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);

  useEffect(() => {
    const savedColumns = localStorage.getItem("demoVisibleColumns");
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("demoVisibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  async function handleAddGuest(name: string) {
    setAddingGuest(true);
    try {
      await addGuest(name);
    } finally {
      // Small delay to show the adding state briefly
      setTimeout(() => setAddingGuest(false), 200);
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

  async function handleMoveAboveListedDeclined(guestId: string) {
    await moveGuestAboveListedDeclined(guestId);
  }

  async function handleCloneGuest(guest: Guest) {
    await cloneGuest(guest);
  }

  const columnCount = useColumnCount(visibleColumns, organization);

  return (
    <div className="relative rounded-lg bg-white shadow flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Guest List</h2>
        <ColumnSettings
          visibleColumns={visibleColumns}
          organization={organization}
          onColumnsChange={setVisibleColumns}
        />
      </div>

      <div className="overflow-x-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-4">#</TableHead>
              <TableHead>Name</TableHead>
              {visibleColumns.categories && (
                <TableHead className="w-40">Categories</TableHead>
              )}
              {visibleColumns.age &&
                organization.configuration?.ageGroups?.enabled && (
                  <TableHead className="w-24">Age</TableHead>
                )}
              {visibleColumns.food &&
                organization.configuration?.foodPreferences?.enabled && (
                  <TableHead className="w-32">Food</TableHead>
                )}
              {visibleColumns.confirmations &&
                organization.configuration?.confirmationStages?.enabled && (
                  <TableHead className="w-32">Status</TableHead>
                )}
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={tableBodyRef}>
            {loading ? (
              <TableLoading columnCount={columnCount} />
            ) : guests.length === 0 ? (
              <EmptyState columnCount={columnCount} />
            ) : (
              guests.map((guest, index) => (
                <SortableRow
                  key={guest.id}
                  guest={guest}
                  index={index + 1}
                  guestIndex={index}
                  guests={guests}
                  visibleColumns={visibleColumns}
                  organization={organization}
                  onUpdate={handleUpdateGuest}
                  onDelete={handleDeleteGuest}
                  onClone={handleCloneGuest}
                  onReorder={handleReorder}
                  onMoveToEnd={handleMoveToEnd}
                  onMoveAboveListedDeclined={handleMoveAboveListedDeclined}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="sticky bottom-0 bg-white border-t shadow-lg z-20 rounded-b-lg">
        <AddGuestSection onAddGuest={handleAddGuest} loading={addingGuest} />
      </div>
    </div>
  );
}
