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
import { useCollaboration } from "@/lib/collaboration-context";

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
  remoteUpdatedGuests: Set<string>;
  setOrganization: (org: Organization | null) => void;
  loadGuests: (organizationId: string) => Promise<void>;
  addGuest: (name: string) => Promise<void>;
  cloneGuest: (guest: Guest) => Promise<void>;
  updateGuest: (guestId: string, updates: Partial<Guest>) => Promise<void>;
  deleteGuest: (guestId: string) => Promise<void>;
  reorderGuests: (
    fromIndex: number,
    toIndex: number,
    includePlusOne?: boolean,
    includeFamilyTogether?: boolean
  ) => Promise<void>;
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
  const [remoteUpdatedGuests, setRemoteUpdatedGuests] = useState<Set<string>>(
    new Set()
  );
  const updateQueue = useRef<UpdateQueueItem[]>([]);
  const processingQueue = useRef(false);
  // Track the latest update timestamp for each guest field to prevent race conditions
  const latestFieldUpdates = useRef<Record<string, Record<string, number>>>({});
  const remoteUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get collaboration functions
  const { broadcastGuestUpdate, onGuestUpdate } = useCollaboration();

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

  // Helper to mark a guest as remotely updated and clear after 5 seconds
  const markGuestAsRemotelyUpdated = useCallback((guestId: string) => {
    // Clear any existing timer for this guest
    if (remoteUpdateTimers.current.has(guestId)) {
      clearTimeout(remoteUpdateTimers.current.get(guestId)!);
    }

    // Add guest to the set of remotely updated guests
    setRemoteUpdatedGuests((prev) => new Set([...prev, guestId]));

    // Set a timer to remove the highlight after 5 seconds
    const timer = setTimeout(() => {
      setRemoteUpdatedGuests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(guestId);
        return newSet;
      });
      remoteUpdateTimers.current.delete(guestId);
    }, 5000);

    remoteUpdateTimers.current.set(guestId, timer);
  }, []);

  // Handle remote guest updates from other users
  const handleRemoteGuestUpdate = useCallback(
    (update: {
      type: string;
      timestamp: string;
      guest?: Guest;
      guestId?: string;
      guestName?: string;
      updates?: Partial<Guest>;
      guestIds?: string[];
      action?: string;
      guest1Id?: string;
      guest1Name?: string;
      guest2Id?: string;
      guest2Name?: string;
    }) => {
      console.log("🔄 Received remote guest update:", update);
      const timestamp = new Date(update.timestamp).getTime();

      switch (update.type) {
        case "guest_added":
          if (update.guest) {
            setGuests((prev) => {
              // Check if guest already exists (avoid duplicates)
              const exists = prev.some((g) => g.id === update.guest!.id);
              if (!exists) {
                // Mark as remotely updated
                markGuestAsRemotelyUpdated(update.guest!.id);
                // Always sort after adding to ensure proper order
                return [...prev, update.guest!].sort(
                  (a, b) => a.display_order - b.display_order
                );
              }
              return prev;
            });
          }
          break;

        case "guest_updated":
          if (update.guestId && update.updates) {
            const fields = Object.keys(update.updates);

            // Check if this update is stale
            if (!isUpdateStale(update.guestId, fields, timestamp)) {
              recordFieldUpdate(update.guestId, fields, timestamp);

              // Mark as remotely updated
              markGuestAsRemotelyUpdated(update.guestId);

              setGuests((prev) =>
                prev.map((guest) => {
                  if (guest.id === update.guestId) {
                    return { ...guest, ...update.updates };
                  }
                  return guest;
                })
              );
            }
          }
          break;

        case "guest_deleted":
          if (update.guestId) {
            setGuests((prev) => prev.filter((g) => g.id !== update.guestId));
          }
          break;

        case "guests_reordered":
          if (update.guestIds) {
            setGuests((prev) => {
              // Create a map for O(1) lookup
              const guestMap = new Map(prev.map((g) => [g.id, g]));

              // Reorder based on the received order
              const reorderedGuests = update
                .guestIds!.map((id: string) => guestMap.get(id))
                .filter(Boolean) as Guest[];

              // Mark all reordered guests as remotely updated
              reorderedGuests.forEach((guest) =>
                markGuestAsRemotelyUpdated(guest.id)
              );

              // Add any guests that weren't in the reorder list (shouldn't happen, but safety)
              const orderedIds = new Set(update.guestIds!);
              const remainingGuests = prev.filter((g) => !orderedIds.has(g.id));

              // Combine and sort by display_order to maintain proper ordering
              const allGuests = [...reorderedGuests, ...remainingGuests];
              return allGuests.sort((a, b) => a.display_order - b.display_order);
            });
          }
          break;

        case "guest_moved":
        case "guests_swapped":
          // For single guest moves or swaps, we need to refresh the guest list to get the updated order
          // These operations change display_order values, so we should fetch fresh data
          if (update.guestId || (update.guest1Id && update.guest2Id)) {
            // Mark affected guests as remotely updated
            if (update.guestId) {
              markGuestAsRemotelyUpdated(update.guestId);
            }
            if (update.guest1Id) {
              markGuestAsRemotelyUpdated(update.guest1Id);
            }
            if (update.guest2Id) {
              markGuestAsRemotelyUpdated(update.guest2Id);
            }

            // Refresh the guest list to get the correct order
            if (organization?.id) {
              // Delay the loadGuests call to avoid dependency issue
              setTimeout(() => {
                // Re-fetch the guests to get the updated order
                fetch(`/api/organizations/${organization.id}/guests`)
                  .then((response) => response.json())
                  .then((data) => {
                    if (data.guests) {
                      // Ensure proper sorting after refetch
                      const sortedGuests = data.guests.sort((a: Guest, b: Guest) => a.display_order - b.display_order);
                      setGuests(sortedGuests);
                    }
                  })
                  .catch(console.error);
              }, 100);
            }
          }
          break;
      }
    },
    [
      isUpdateStale,
      recordFieldUpdate,
      markGuestAsRemotelyUpdated,
      organization?.id,
    ]
  );

  // Subscribe to remote updates
  useEffect(() => {
    return onGuestUpdate(handleRemoteGuestUpdate);
  }, [onGuestUpdate, handleRemoteGuestUpdate]);

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

        // Broadcast update to other users after successful API call
        if (update.type === "add" && data.guest) {
          // Replace temp guest with real one
          setGuests((prev) =>
            prev.map((g) => (g.id === update.guestId ? data.guest : g))
          );

          // Broadcast to others
          broadcastGuestUpdate({
            type: "guest_added",
            guest: data.guest,
          });
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

            // Broadcast to others
            broadcastGuestUpdate({
              type: "guest_updated",
              guestId: update.guestId,
              updates: update.newState as Partial<Guest>,
            });
          }
        } else if (update.type === "delete" && update.guestId) {
          // Broadcast deletion
          broadcastGuestUpdate({
            type: "guest_deleted",
            guestId: update.guestId,
          });
        } else if (update.type === "reorder" && update.newState) {
          // Broadcast reorder
          const newGuests = update.newState as Guest[];
          broadcastGuestUpdate({
            type: "guests_reordered",
            guestIds: newGuests.map((g) => g.id),
          });
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
  }, [isUpdateStale, broadcastGuestUpdate]);

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
        // Ensure guests are always sorted by display_order
        const sortedGuests = (data.guests || []).sort((a: Guest, b: Guest) => a.display_order - b.display_order);
        setGuests(sortedGuests);
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
        display_order: guests.length + 1,
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

  const cloneGuest = useCallback(
    async (guestToClone: Guest) => {
      if (!organization) return;

      const tempId = `temp-${Date.now()}`;
      const clonedName = `${guestToClone.name}'s +1`;

      // Find the index of the guest to clone
      const sourceIndex = guests.findIndex((g) => g.id === guestToClone.id);
      const insertPosition = sourceIndex + 1;

      // The new guest should be inserted right after the source
      const newGuest: Guest = {
        ...guestToClone,
        id: tempId,
        name: clonedName,
        display_order: insertPosition + 1, // Use proper integer position
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Optimistic update - insert at the correct position and resequence all display_order values
      setGuests((prev) => {
        const newGuests = [...prev];
        newGuests.splice(insertPosition, 0, newGuest);
        // Ensure all display_order values are sequential
        return newGuests.map((g, idx) => ({
          ...g,
          display_order: idx + 1,
        }));
      });

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
            body: JSON.stringify({
              name: clonedName,
              categories: guestToClone.categories,
              age_group: guestToClone.age_group,
              food_preferences: guestToClone.food_preferences,
              food_preference: guestToClone.food_preference,
              confirmation_stage: guestToClone.confirmation_stage,
              custom_fields: guestToClone.custom_fields,
              family_color: guestToClone.family_color,
              target_position: insertPosition + 1,
            }),
          }),
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      });
    },
    [organization, guests]
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
    async (
      fromIndex: number,
      toIndex: number,
      includePlusOne: boolean = true,
      includeFamilyTogether: boolean = false
    ) => {
      if (!organization) return;

      let newGuests: Guest[] = [];
      const originalOrder = [...guests];

      if (includePlusOne || includeFamilyTogether) {
        // Helper to check if g2 is the "+1" of g1
        const isPlusOneOf = (g1: Guest, g2: Guest) =>
          g1.name === `${g2.name}'s +1`;

        // Helper to check if two guests are in the same family (same color)
        const isSameFamily = (g1: Guest, g2: Guest) =>
          g1.family_color &&
          g2.family_color &&
          g1.family_color === g2.family_color;

        // Determine the contiguous block to move (primary + possible +1 + possible family)
        let blockStart = fromIndex;
        let blockEnd = fromIndex;

        // Handle +1 relationships first (if enabled)
        if (includePlusOne) {
          // Case 1: the next guest is the dragged guest's +1
          if (
            fromIndex + 1 < guests.length &&
            isPlusOneOf(guests[fromIndex + 1], guests[fromIndex])
          ) {
            blockEnd = fromIndex + 1;
          }
          // Case 2: the dragged guest itself is a +1 -> move it together with the previous guest
          else if (
            fromIndex - 1 >= 0 &&
            isPlusOneOf(guests[fromIndex], guests[fromIndex - 1])
          ) {
            blockStart = fromIndex - 1;
          }
        }

        // Handle family grouping (if enabled)
        if (includeFamilyTogether) {
          // Expand block to include all adjacent family members
          // Keep expanding backwards while we find family members
          while (blockStart > 0) {
            const currentStartGuest = guests[blockStart];
            const previousGuest = guests[blockStart - 1];
            if (isSameFamily(currentStartGuest, previousGuest)) {
              blockStart--;
            } else {
              break;
            }
          }

          // Keep expanding forwards while we find family members
          while (blockEnd < guests.length - 1) {
            const currentEndGuest = guests[blockEnd];
            const nextGuest = guests[blockEnd + 1];
            if (isSameFamily(currentEndGuest, nextGuest)) {
              blockEnd++;
            } else {
              break;
            }
          }
        }

        // Calculate the final insert position taking the removal shift into account
        const blockSize = blockEnd - blockStart + 1;
        let insertPos = toIndex;

        if (insertPos > blockStart) {
          // Removing the block shifts the target index to the left
          insertPos = insertPos - blockSize + 1;
        }

        // Clamp insert position
        insertPos = Math.max(0, Math.min(guests.length - blockSize, insertPos));

        // Build the new guest list
        const movingBlock = guests.slice(blockStart, blockEnd + 1);
        const withoutBlock = guests.filter(
          (_, idx) => idx < blockStart || idx > blockEnd
        );
        newGuests = [
          ...withoutBlock.slice(0, insertPos),
          ...movingBlock,
          ...withoutBlock.slice(insertPos),
        ];
      } else {
        // Simple single-item reorder
        newGuests = reorder({
          list: guests,
          startIndex: fromIndex,
          finishIndex: toIndex,
        });
      }

      // Optimistic update
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
        remoteUpdatedGuests,
        setOrganization,
        loadGuests,
        addGuest,
        cloneGuest,
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
