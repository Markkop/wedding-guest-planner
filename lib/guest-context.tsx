"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { toast } from "sonner";
import type { Guest, Organization, GuestStatistics } from "@/lib/types";

type UpdateType = "add" | "update" | "delete" | "reorder";

interface UpdateQueueItem {
  id: string;
  type: UpdateType;
  guestId?: string;
  previousState?: Guest | Guest[];
  newState?: Partial<Guest> | Guest[];
  updatedFields?: string[]; // Track which fields this update modifies
  apiCall: () => Promise<Response>;
  timestamp: number;
  status: "pending" | "processing" | "completed" | "failed";
  retryCount: number;
}

interface GuestContextType {
  guests: Guest[];
  loading: boolean;
  stats: GuestStatistics;
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
  loadGuests: (organizationId: string) => Promise<void>;
  addGuest: (name: string) => Promise<void>;
  updateGuest: (guestId: string, updates: Partial<Guest>) => Promise<void>;
  deleteGuest: (guestId: string) => Promise<void>;
  reorderGuests: (fromIndex: number, toIndex: number) => Promise<void>;
  moveGuestToEnd: (guestId: string) => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function useGuests() {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error("useGuests must be used within a GuestProvider");
  }
  return context;
}

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const updateQueue = useRef<UpdateQueueItem[]>([]);
  const processingQueue = useRef(false);
  // Track the latest update timestamp for each guest field to prevent race conditions
  const latestFieldUpdates = useRef<Record<string, Record<string, number>>>({});

  // Calculate statistics locally from guest data
  const calculateStats = useCallback((guestList: Guest[]): GuestStatistics => {
    const stats: GuestStatistics = {
      total: guestList.length,
      confirmed: 0,
      invited: 0,
      declined: 0,
      byCategory: {},
      byConfirmationStage: {},
    };

    guestList.forEach((guest) => {
      // Count by confirmation stage
      const stage = guest.confirmation_stage || "invited";
      stats.byConfirmationStage[stage] =
        (stats.byConfirmationStage[stage] || 0) + 1;

      // Count confirmed (assuming 'confirmed' is the stage id)
      if (stage === "confirmed") {
        stats.confirmed++;
      } else if (stage === "invited") {
        stats.invited++;
      } else if (stage === "declined") {
        stats.declined++;
      }

      // Count by category
      guest.categories?.forEach((categoryId) => {
        if (categoryId) {
          stats.byCategory[categoryId] =
            (stats.byCategory[categoryId] || 0) + 1;
        }
      });
    });

    return stats;
  }, []);

  const stats = calculateStats(guests);

  // Helper functions for managing field update timestamps
  const recordFieldUpdate = useCallback(
    (guestId: string, fields: string[], timestamp: number) => {
      if (!latestFieldUpdates.current[guestId]) {
        latestFieldUpdates.current[guestId] = {};
      }
      fields.forEach((field) => {
        latestFieldUpdates.current[guestId][field] = timestamp;
      });
    },
    []
  );

  const isUpdateStale = useCallback(
    (guestId: string, fields: string[], timestamp: number): boolean => {
      if (!latestFieldUpdates.current[guestId]) return false;

      return fields.some((field) => {
        const latestTimestamp = latestFieldUpdates.current[guestId][field];
        return latestTimestamp && latestTimestamp > timestamp;
      });
    },
    []
  );

  // Process update queue
  const processQueue = useCallback(async () => {
    if (processingQueue.current || updateQueue.current.length === 0) return;

    processingQueue.current = true;

    while (updateQueue.current.length > 0) {
      const update = updateQueue.current.find((u) => u.status === "pending");
      if (!update) break;

      update.status = "processing";

      try {
        const response = await update.apiCall();
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Request failed");
        }

        update.status = "completed";

        // Update with server response if needed
        if (update.type === "add" && data.guest) {
          // Replace temp guest with real one
          setGuests((prev) =>
            prev.map((g) => (g.id === update.guestId ? data.guest : g))
          );
        } else if (
          update.type === "update" &&
          data.guest &&
          update.guestId &&
          update.updatedFields
        ) {
          // Check if this update is stale before applying
          if (
            !isUpdateStale(
              update.guestId,
              update.updatedFields,
              update.timestamp
            )
          ) {
            // Only merge fields that aren't stale
            setGuests((prev) =>
              prev.map((g) => {
                if (g.id !== update.guestId) return g;

                // Create a filtered update object with only non-stale fields
                const filteredUpdate: Partial<Guest> = {};
                Object.keys(data.guest).forEach((key) => {
                  if (
                    update.updatedFields?.includes(key) &&
                    !isUpdateStale(update.guestId!, [key], update.timestamp)
                  ) {
                    (filteredUpdate as Record<string, unknown>)[key] = (
                      data.guest as unknown as Record<string, unknown>
                    )[key];
                  }
                });

                return { ...g, ...filteredUpdate };
              })
            );
          }
        }

        // Remove completed update from queue
        updateQueue.current = updateQueue.current.filter(
          (u) => u.id !== update.id
        );
      } catch (error) {
        update.status = "failed";
        update.retryCount++;

        // Rollback this specific update
        if (update.previousState) {
          if (update.type === "add") {
            // Remove the added guest
            setGuests((prev) => prev.filter((g) => g.id !== update.guestId));
          } else if (
            update.type === "update" &&
            update.guestId &&
            update.updatedFields
          ) {
            // Restore previous state for this guest, but only for the failed fields
            const prevGuest = update.previousState as Guest;
            setGuests((prev) =>
              prev.map((g) => {
                if (g.id !== update.guestId) return g;

                // Only restore the fields that were in this update
                const rollbackUpdate: Partial<Guest> = {};
                update.updatedFields!.forEach((field) => {
                  (rollbackUpdate as Record<string, unknown>)[field] = (
                    prevGuest as unknown as Record<string, unknown>
                  )[field];
                });

                return { ...g, ...rollbackUpdate };
              })
            );

            // Clear the field update timestamps for the failed fields
            if (latestFieldUpdates.current[update.guestId]) {
              update.updatedFields.forEach((field) => {
                if (
                  latestFieldUpdates.current[update.guestId!][field] ===
                  update.timestamp
                ) {
                  delete latestFieldUpdates.current[update.guestId!][field];
                }
              });
            }
          } else if (update.type === "delete") {
            // Restore deleted guest
            const deletedGuest = update.previousState as Guest;
            setGuests((prev) => {
              const newGuests = [...prev];
              // Insert at original position if possible
              const insertIndex = Math.min(
                deletedGuest.display_order,
                newGuests.length
              );
              newGuests.splice(insertIndex, 0, deletedGuest);
              return newGuests;
            });
          } else if (update.type === "reorder") {
            // Restore original order
            setGuests(update.previousState as Guest[]);
          }
        }

        // Show error
        toast.error(
          error instanceof Error ? error.message : "Operation failed"
        );

        // Remove failed update from queue
        updateQueue.current = updateQueue.current.filter(
          (u) => u.id !== update.id
        );
      }
    }

    processingQueue.current = false;
  }, [isUpdateStale]);

  // Start processing queue when items are added
  useEffect(() => {
    const interval = setInterval(() => {
      if (updateQueue.current.some((u) => u.status === "pending")) {
        processQueue();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [processQueue]);

  const loadGuests = useCallback(async (organizationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/guests`
      );
      const data = await response.json();
      if (response.ok) {
        setGuests(data.guests || []);
      } else {
        toast.error(data.error || "Failed to fetch guests");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch guests"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addGuest = useCallback(
    async (name: string) => {
      if (!organization) return;

      const tempId = `temp-${Date.now()}`;
      const config = organization.configuration;
      const newGuest: Guest = {
        id: tempId,
        organization_id: organization.id,
        name,
        categories: [config.categories[0]?.id || ""],
        age_group: config.ageGroups.enabled
          ? config.ageGroups.groups[0]?.id
          : undefined,
        food_preference: config.foodPreferences.enabled
          ? config.foodPreferences.options[0]?.id
          : undefined,
        confirmation_stage: config.confirmationStages.enabled
          ? config.confirmationStages.stages[0]?.id
          : "invited",
        custom_fields: {},
        display_order: guests.length,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Optimistic update
      setGuests((prev) => [...prev, newGuest]);

      // Add to queue
      const updateId = `add-${Date.now()}`;
      updateQueue.current.push({
        id: updateId,
        type: "add",
        guestId: tempId,
        previousState: undefined,
        newState: newGuest,
        apiCall: () =>
          fetch(`/api/organizations/${organization.id}/guests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          }),
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      });
    },
    [organization, guests.length]
  );

  const updateGuest = useCallback(
    async (guestId: string, updates: Partial<Guest>) => {
      const originalGuest = guests.find((g) => g.id === guestId);
      if (!originalGuest) return;

      const timestamp = Date.now();
      const updatedFields = Object.keys(updates);

      // Record this as the latest update for these fields
      recordFieldUpdate(guestId, updatedFields, timestamp);

      // Optimistic update
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, ...updates } : g))
      );

      // Add to queue
      const updateId = `update-${guestId}-${timestamp}`;
      updateQueue.current.push({
        id: updateId,
        type: "update",
        guestId,
        previousState: originalGuest,
        newState: updates,
        updatedFields,
        apiCall: () =>
          fetch(`/api/guests/${guestId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }),
        timestamp,
        status: "pending",
        retryCount: 0,
      });
    },
    [guests, recordFieldUpdate]
  );

  const deleteGuest = useCallback(
    async (guestId: string) => {
      const guestToDelete = guests.find((g) => g.id === guestId);
      if (!guestToDelete) return;

      // Optimistic update
      setGuests((prev) => prev.filter((g) => g.id !== guestId));

      // Add to queue
      const updateId = `delete-${guestId}-${Date.now()}`;
      updateQueue.current.push({
        id: updateId,
        type: "delete",
        guestId,
        previousState: guestToDelete,
        apiCall: () =>
          fetch(`/api/guests/${guestId}`, {
            method: "DELETE",
          }),
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      });
    },
    [guests]
  );

  const reorderGuests = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!organization) return;

      const originalOrder = [...guests];

      // Optimistic update using reorder logic
      const newGuests = reorder({
        list: guests,
        startIndex: fromIndex,
        finishIndex: toIndex,
      });
      setGuests(newGuests);

      // Add to queue
      const updateId = `reorder-${Date.now()}`;
      updateQueue.current.push({
        id: updateId,
        type: "reorder",
        previousState: originalOrder,
        newState: newGuests,
        apiCall: () =>
          fetch(`/api/organizations/${organization.id}/guests/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestIds: newGuests.map((g) => g.id) }),
          }),
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      });
    },
    [guests, organization]
  );

  const moveGuestToEnd = useCallback(
    async (guestId: string) => {
      if (!organization) return;

      const guestIndex = guests.findIndex((g) => g.id === guestId);
      if (guestIndex === -1 || guestIndex === guests.length - 1) return;

      const originalOrder = [...guests];

      // Optimistic update
      const guestToMove = guests[guestIndex];
      const newGuests = [
        ...guests.slice(0, guestIndex),
        ...guests.slice(guestIndex + 1),
        guestToMove,
      ];
      setGuests(newGuests);

      // Add to queue
      const updateId = `move-end-${guestId}-${Date.now()}`;
      updateQueue.current.push({
        id: updateId,
        type: "reorder",
        previousState: originalOrder,
        newState: newGuests,
        apiCall: () =>
          fetch(`/api/organizations/${organization.id}/guests/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestIds: newGuests.map((g) => g.id) }),
          }),
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      });
    },
    [guests, organization]
  );

  return (
    <GuestContext.Provider
      value={{
        guests,
        loading,
        stats,
        organization,
        setOrganization,
        loadGuests,
        addGuest,
        updateGuest,
        deleteGuest,
        reorderGuests,
        moveGuestToEnd,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

// Re-export the context so alternative providers (e.g. demo/local providers) can
// supply a compatible value, allowing components that rely on the default
// `useGuests` hook to work seamlessly in different scenarios (such as the demo
// landing page).
export { GuestContext };
