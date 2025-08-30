"use client";

import React, { useContext, useState, useCallback } from "react";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { toast } from "sonner";
import type { Guest, Organization, GuestStatistics } from "@/lib/types";

// Demo organization configuration - same as original but for landing page
const DEMO_ORGANIZATION: Organization = {
  id: "demo-org-1",
  name: "Sarah & Michael's Wedding",
  invite_code: "DEMO2024",
  admin_id: "demo-admin",
  event_type: "wedding",
  configuration: {
    categories: [
      { id: "bride", label: "Bride's Side", initial: "B", color: "#EC4899" },
      { id: "groom", label: "Groom's Side", initial: "G", color: "#3B82F6" },
      { id: "mutual", label: "Mutual Friends", initial: "M", color: "#10B981" },
    ],
    ageGroups: {
      enabled: true,
      groups: [
        { id: "adult", label: "Adult", minAge: 18 },
        { id: "child", label: "Child (7-17)", minAge: 7 },
        { id: "infant", label: "Infant (0-6)", minAge: 0 },
      ],
    },
    foodPreferences: {
      enabled: true,
      options: [
        { id: "none", label: "No restrictions" },
        { id: "vegetarian", label: "Vegetarian" },
        { id: "vegan", label: "Vegan" },
        { id: "gluten_free", label: "Gluten-free" },
        { id: "dairy_free", label: "Dairy-free" },
      ],
    },
    confirmationStages: {
      enabled: true,
      stages: [
        { id: "invited", label: "Invited", order: 1 },
        { id: "confirmed", label: "Confirmed", order: 2 },
        { id: "declined", label: "Declined", order: 3 },
      ],
    },
  },
  created_at: new Date("2024-01-01"),
  updated_at: new Date(),
  role: "admin",
};

// Demo guests data - same as original but for landing page
const DEMO_GUESTS: Guest[] = [
  {
    id: "guest-1",
    organization_id: "demo-org-1",
    name: "Emma Thompson",
    categories: ["bride"],
    age_group: "adult",
    food_preference: "vegetarian",
    confirmation_stage: "confirmed",
    custom_fields: {},
    display_order: 0,
    created_at: new Date("2024-01-15"),
    updated_at: new Date("2024-01-15"),
  },
  {
    id: "guest-2",
    organization_id: "demo-org-1",
    name: "James Wilson",
    categories: ["groom"],
    age_group: "adult",
    food_preference: "none",
    confirmation_stage: "confirmed",
    custom_fields: {},
    display_order: 1,
    created_at: new Date("2024-01-16"),
    updated_at: new Date("2024-01-16"),
  },
  {
    id: "guest-3",
    organization_id: "demo-org-1",
    name: "Lucy Chen",
    categories: ["mutual"],
    age_group: "adult",
    food_preference: "gluten_free",
    confirmation_stage: "invited",
    custom_fields: {},
    display_order: 2,
    created_at: new Date("2024-01-17"),
    updated_at: new Date("2024-01-17"),
  },
  {
    id: "guest-4",
    organization_id: "demo-org-1",
    name: "Oliver Martinez",
    categories: ["bride"],
    age_group: "adult",
    food_preference: "vegan",
    confirmation_stage: "declined",
    custom_fields: {},
    display_order: 3,
    created_at: new Date("2024-01-18"),
    updated_at: new Date("2024-01-18"),
  },
  {
    id: "guest-5",
    organization_id: "demo-org-1",
    name: "Sophie Davis",
    categories: ["groom"],
    age_group: "adult",
    food_preference: "dairy_free",
    confirmation_stage: "confirmed",
    custom_fields: {},
    display_order: 4,
    created_at: new Date("2024-01-19"),
    updated_at: new Date("2024-01-19"),
  },
];

// Instead of providing a separate context (which breaks components relying on
// the default GuestContext), we will *also* provide values via the shared
// GuestContext so that components like StatsCards can consume them without
// modification.
import { GuestContext } from "@/lib/guest-context";
import { GuestContext as CollaborativeGuestContext } from "@/lib/collaborative-guest-context";

export function useGuests() {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error("useGuests must be used within a GuestProvider");
  }
  return context;
}

// Calculate statistics locally from guest data
function calculateStats(guestList: Guest[]): GuestStatistics {
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
        stats.byCategory[categoryId] = (stats.byCategory[categoryId] || 0) + 1;
      }
    });
  });

  return stats;
}

export function LocalGuestProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [guests, setGuests] = useState<Guest[]>(DEMO_GUESTS);
  const [loading] = useState(false); // Always false since we use optimistic updates
  const [organization] = useState<Organization>(DEMO_ORGANIZATION);

  const stats = calculateStats(guests);

  const setOrganization = useCallback(() => {
    // No-op for local provider - organization is fixed
  }, []);

  const loadGuests = useCallback(async () => {
    // No-op for local provider - guests are loaded from state
  }, []);

  const addGuest = useCallback(
    async (name: string) => {
      if (!name.trim()) return;

      const config = DEMO_ORGANIZATION.configuration;
      const newGuest: Guest = {
        id: `guest-${Date.now()}`,
        organization_id: DEMO_ORGANIZATION.id,
        name: name.trim(),
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

      // Simulate API delay in background
      setTimeout(() => {
        toast.success(`Added ${name.trim()}`);
      }, 100);
    },
    [guests.length]
  );

  const cloneGuest = useCallback(
    async (guestToClone: Guest) => {
      const clonedName = `${guestToClone.name}'s +1`;
      
      // Find the index of the guest to clone
      const sourceIndex = guests.findIndex(g => g.id === guestToClone.id);
      const insertPosition = sourceIndex + 1;
      
      // Create new guest with unique ID
      const newGuest: Guest = {
        ...guestToClone,
        id: `guest-${Date.now()}`,
        name: clonedName,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Insert at the correct position and update all display_order values
      setGuests((prev) => {
        const newGuests = [...prev];
        newGuests.splice(insertPosition, 0, newGuest);
        // Update display_order for all guests
        return newGuests.map((g, idx) => ({
          ...g,
          display_order: idx
        }));
      });

      setTimeout(() => {
        toast.success(`Added ${clonedName}`);
      }, 100);
    },
    [guests]
  );

  const updateGuest = useCallback(
    async (guestId: string, updates: Partial<Guest>) => {
      // Optimistic update
      setGuests((prev) =>
        prev.map((guest) =>
          guest.id === guestId
            ? { ...guest, ...updates, updated_at: new Date() }
            : guest
        )
      );

      // Background success notification
      setTimeout(() => {
        // Only show toast for name changes, not for silent updates like categories
        if (updates.name) {
          toast.success("Guest updated");
        }
      }, 100);
    },
    []
  );

  const deleteGuest = useCallback(
    async (guestId: string) => {
      const guest = guests.find((g) => g.id === guestId);
      if (!guest) return;

      // Optimistic update
      setGuests((prev) => prev.filter((g) => g.id !== guestId));

      // Background success notification
      setTimeout(() => {
        toast.success(`Removed ${guest.name}`);
      }, 100);
    },
    [guests]
  );

  const reorderGuests = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      // Optimistic update
      setGuests((prev) => {
        const reordered = reorder({
          list: prev,
          startIndex: fromIndex,
          finishIndex: toIndex,
        });

        // Update display_order for all affected items
        return reordered.map((guest, index) => ({
          ...guest,
          display_order: index,
          updated_at: new Date(),
        }));
      });
    },
    []
  );

  const moveGuestToEnd = useCallback(
    async (guestId: string) => {
      const guestIndex = guests.findIndex((g) => g.id === guestId);
      if (guestIndex === -1 || guestIndex === guests.length - 1) return;

      await reorderGuests(guestIndex, guests.length - 1);
    },
    [guests, reorderGuests]
  );


  return (
    /*
     * Expose the same value through BOTH the generic `GuestContext` and the
     * collaborative guest context so that components (like `StatsCards`) that
     * import `useGuests` from either module work seamlessly in the demo
     * landing page. This avoids having to duplicate components or change their
     * imports while keeping the demo fully self-contained and non-collaborative.
     */
    <GuestContext.Provider
      value={{
        guests,
        loading,
        stats,
        organization,
        setOrganization,
        loadGuests,
        addGuest,
        cloneGuest,
        updateGuest,
        deleteGuest,
        reorderGuests,
        moveGuestToEnd,
        remoteUpdatedGuests: new Set<string>(),
      }}
    >
      <CollaborativeGuestContext.Provider
        value={{
          guests,
          loading,
          stats,
          organization,
          setOrganization,
          loadGuests,
          addGuest,
          cloneGuest,
          updateGuest,
          deleteGuest,
          reorderGuests,
          moveGuestToEnd,
          remoteUpdatedGuests: new Set<string>(),
        }}
      >
        {children}
      </CollaborativeGuestContext.Provider>
    </GuestContext.Provider>
  );
}
