"use client";

import { useEffect, useState, useRef } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useGuests } from "@/lib/collaborative-guest-context";
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
    remoteUpdatedGuests,
  } = useGuests();

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    categories: true,
    age: organization.configuration?.ageGroups?.enabled ?? false,
    food: organization.configuration?.foodPreferences?.enabled ?? false,
    confirmations:
      organization.configuration?.confirmationStages?.enabled ?? false,
  });
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);

  // Helper function to get sorted custom fields
  const getSortedCustomFields = () => {
    const customFields = organization.configuration?.customFields || [];
    
    // Separate fields with displayOrder from those without
    const withOrder = customFields.filter(f => f.displayOrder !== undefined);
    const withoutOrder = customFields.filter(f => f.displayOrder === undefined);
    
    // Sort fields with displayOrder
    withOrder.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    
    return { withOrder, withoutOrder };
  };

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
              {(() => {
                const { withOrder, withoutOrder } = getSortedCustomFields();
                const headers: React.ReactElement[] = [];
                
                // Build standard columns in order
                const standardColumns: React.ReactElement[] = [];
                
                standardColumns.push(
                  <TableHead key="index" className="w-12 pl-4">#</TableHead>
                );
                standardColumns.push(
                  <TableHead key="name" className="sticky left-0 bg-white z-10 border-r md:static md:bg-transparent md:border-r-0 w-auto md:min-w-[200px]">
                    Name
                  </TableHead>
                );
                
                if (visibleColumns.categories) {
                  standardColumns.push(
                    <TableHead key="categories" className="w-40">Categories</TableHead>
                  );
                }
                
                if (visibleColumns.age && organization.configuration?.ageGroups?.enabled) {
                  standardColumns.push(
                    <TableHead key="age" className="w-24">Age</TableHead>
                  );
                }
                
                if (visibleColumns.food && organization.configuration?.foodPreferences?.enabled) {
                  standardColumns.push(
                    <TableHead key="food" className="w-32">Food</TableHead>
                  );
                }
                
                if (visibleColumns.confirmations && organization.configuration?.confirmationStages?.enabled) {
                  standardColumns.push(
                    <TableHead key="status" className="w-32">Status</TableHead>
                  );
                }
                
                // Insert custom fields with displayOrder at their specified positions
                let currentHeaders = [...standardColumns];
                withOrder.forEach(field => {
                  const position = Math.min(field.displayOrder ?? currentHeaders.length, currentHeaders.length);
                  const customHeader = (
                    <TableHead key={field.id} className="w-32">
                      {field.label}
                    </TableHead>
                  );
                  currentHeaders.splice(position, 0, customHeader);
                });
                
                // Add custom fields without displayOrder after standard columns
                withoutOrder.forEach(field => {
                  currentHeaders.push(
                    <TableHead key={field.id} className="w-32">
                      {field.label}
                    </TableHead>
                  );
                });
                
                // Add actions column at the end
                currentHeaders.push(
                  <TableHead key="actions" className="w-32">Actions</TableHead>
                );
                
                return currentHeaders;
              })()}
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
                  isRemotelyUpdated={remoteUpdatedGuests?.has?.(guest.id) ?? false}
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

      <div className="sticky bottom-0 bg-white border-t shadow-lg z-20 rounded-b-lg">
        <AddGuestSection onAddGuest={handleAddGuest} loading={loading} />
      </div>
    </div>
  );
}
