"use client";

import { useEffect, useState, useRef } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useGuests } from "@/lib/guest-context";
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
import type { VisibleColumns, Guest, Organization } from "@/lib/types";

interface GuestTableProps {
  organizationId: string;
  organization: Organization;
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
    setOrganization,
  } = useGuests();

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    categories: true,
    age: organization.configuration?.ageGroups?.enabled ?? false,
    food: organization.configuration?.foodPreferences?.enabled ?? false,
    confirmations:
      organization.configuration?.confirmationStages?.enabled ?? false,
  });
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);

  useEffect(() => {
    setOrganization(organization);
    loadGuests(organizationId);
    const savedColumns = localStorage.getItem("visibleColumns");
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns));
    }
  }, [organizationId, organization, loadGuests, setOrganization]);

  useEffect(() => {
    localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  async function handleAddGuest(name: string) {
    await addGuest(name);
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

  const columnCount = useColumnCount(visibleColumns, organization);

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Guest List</h2>
        <ColumnSettings
          visibleColumns={visibleColumns}
          organization={organization}
          onColumnsChange={setVisibleColumns}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-4">#</TableHead>
              <TableHead className="sticky left-0 bg-white z-10 border-r md:static md:bg-transparent md:border-r-0 w-auto md:min-w-[200px]">
                Name
              </TableHead>
              {visibleColumns.categories && (
                <TableHead className="w-32">Categories</TableHead>
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
              <TableHead className="w-32">Actions</TableHead>
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
      </div>

      <AddGuestSection onAddGuest={handleAddGuest} loading={loading} />
    </div>
  );
}
