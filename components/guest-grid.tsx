"use client";

import { useState, useEffect, useRef } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useGuests } from "@/lib/collaborative-guest-context";
import { cn } from "@/lib/utils";
import { GuestColorPicker } from "@/components/guest-color-picker";
import { GridSettings } from "@/components/grid-settings";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import type { Guest, Organization } from "@/lib/types";

function useResponsiveColumns() {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) setColumns(6); // lg
      else if (width >= 768) setColumns(5); // md
      else setColumns(3); // default
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}

interface GuestGridProps {
  organizationId: string;
  organization: Organization;
}

export function GuestGrid({ organizationId, organization }: GuestGridProps) {
  const {
    guests,
    loading,
    loadGuests,
    reorderGuests,
    updateGuest,
    deleteGuest,
    cloneGuest,
    setOrganization,
  } = useGuests();
  const [dragPlusOne, setDragPlusOne] = useState(true);
  const [dragFamilyTogether, setDragFamilyTogether] = useState(true);
  const [showFamilyBgColor, setShowFamilyBgColor] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(true);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showPlusOneButton, setShowPlusOneButton] = useState(false);
  const columns = useResponsiveColumns();

  useEffect(() => {
    setOrganization(organization);
    loadGuests(organizationId);
  }, [organizationId, organization, loadGuests, setOrganization]);

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
    await reorderGuests(fromIndex, toIndex, dragPlusOne, dragFamilyTogether);
  }

  const handleColorChange = (guestId: string, color: string | null) => {
    updateGuest(guestId, { family_color: color });
  };

  const handleDeleteGuest = async (guestId: string) => {
    await deleteGuest(guestId);
  };

  const handleCloneGuest = async (guest: Guest) => {
    await cloneGuest(guest);
  };

  return (
    <div className="relative rounded-lg bg-white shadow flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Guest Grid</h2>
        <div className="flex items-center gap-2">
          <GridSettings
            dragPlusOne={dragPlusOne}
            dragFamilyTogether={dragFamilyTogether}
            showFamilyBgColor={showFamilyBgColor}
            showColorPicker={showColorPicker}
            showDeleteButton={showDeleteButton}
            showPlusOneButton={showPlusOneButton}
            onDragPlusOneChange={setDragPlusOne}
            onDragFamilyTogetherChange={setDragFamilyTogether}
            onShowFamilyBgColorChange={setShowFamilyBgColor}
            onShowColorPickerChange={setShowColorPicker}
            onShowDeleteButtonChange={setShowDeleteButton}
            onShowPlusOneButtonChange={setShowPlusOneButton}
          />
          <div className="text-sm text-gray-500 whitespace-nowrap">
            {guests.length} guests
          </div>
        </div>
      </div>

      <div className="p-0.5">
        {loading ? (
          <div
            className={`grid gap-0.5 ${
              columns === 3
                ? "grid-cols-3"
                : columns === 5
                ? "grid-cols-5"
                : columns === 6
                ? "grid-cols-6"
                : "grid-cols-3"
            }`}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No guests yet. Add your first guest below.
          </div>
        ) : (
          <div
            className={`grid gap-0.5 ${
              columns === 3
                ? "grid-cols-3"
                : columns === 5
                ? "grid-cols-5"
                : columns === 6
                ? "grid-cols-6"
                : "grid-cols-3"
            }`}
          >
            {(() => {
              const rows = Math.ceil(guests.length / columns);
              const arrangedGuests = [];

              for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                  const index = col * rows + row;
                  if (index < guests.length) {
                    arrangedGuests.push(guests[index]);
                  }
                }
              }

              return arrangedGuests.map((guest) => {
                const originalIndex = guests.findIndex(
                  (g) => g.id === guest.id
                );
                return (
                  <GuestGridItem
                    key={guest.id}
                    guest={guest}
                    index={originalIndex + 1}
                    guestIndex={originalIndex}
                    guests={guests}
                    onReorder={handleReorder}
                    onColorChange={handleColorChange}
                    onDelete={handleDeleteGuest}
                    onClone={handleCloneGuest}
                    organization={organization}
                    showFamilyBgColor={showFamilyBgColor}
                    showColorPicker={showColorPicker}
                    showDeleteButton={showDeleteButton}
                    showPlusOneButton={showPlusOneButton}
                  />
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

interface GuestGridItemProps {
  guest: Guest;
  index: number;
  guestIndex: number;
  guests: Guest[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onColorChange: (guestId: string, color: string | null) => void;
  onDelete: (guestId: string) => void;
  onClone: (guest: Guest) => void;
  organization: Organization;
  showFamilyBgColor: boolean;
  showColorPicker: boolean;
  showDeleteButton: boolean;
  showPlusOneButton: boolean;
}

function GuestGridItem({
  guest,
  index,
  guestIndex,
  guests,
  onReorder,
  onColorChange,
  onDelete,
  onClone,
  organization,
  showFamilyBgColor,
  showColorPicker,
  showDeleteButton,
  showPlusOneButton,
}: GuestGridItemProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isBeingDragged, setIsBeingDragged] = useState(false);
  const itemRef = useRef<HTMLDivElement | null>(null);

  const isDeclined = guest.confirmation_stage === "declined";

  // Get the category color for the number circle
  const getCategoryColor = () => {
    if (!guest.categories || guest.categories.length === 0) {
      return "#E0E7FF"; // Default indigo-100 color
    }

    const config = organization.configuration || {};
    const categories = config.categories || [];

    // Find the first category the guest belongs to
    for (const categoryId of guest.categories) {
      const category = categories.find((cat) => cat.id === categoryId);
      if (category) {
        return category.color;
      }
    }

    return "#E0E7FF"; // Default color if no category found
  };

  // Get the text color for the number (dark for light backgrounds, light for dark backgrounds)
  const getTextColor = (bgColor: string) => {
    // Simple brightness check - if background is light, use dark text
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#1F2937" : "#FFFFFF"; // gray-800 or white
  };

  // Convert hex color to RGBA with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get the faded background color for the guest item
  const getFadedBackgroundColor = () => {
    if (guest.family_color && !isDraggedOver && !isDeclined && showFamilyBgColor) {
      return hexToRgba(guest.family_color, 0.15); // Very faded at 15% opacity
    }
    return undefined;
  };

  useEffect(() => {
    const itemElement = itemRef.current;
    if (!itemElement) return;

    // Make the grid item draggable
    const cleanupDraggable = draggable({
      element: itemElement,
      getInitialData: () => ({
        type: "GUEST_GRID_ITEM",
        guestId: guest.id,
        fromIndex: guestIndex,
      }),
      onGenerateDragPreview({ nativeSetDragImage }) {
        nativeSetDragImage?.(itemElement, 20, 20);
      },
      onDragStart() {
        setIsBeingDragged(true);
      },
      onDrop() {
        setIsBeingDragged(false);
      },
    });

    // Make the item a drop target
    const cleanupDropTarget = dropTargetForElements({
      element: itemElement,
      canDrop({ source }) {
        return (
          source.data.type === "GUEST_GRID_ITEM" &&
          source.data.guestId !== guest.id
        );
      },
      getData() {
        return { toIndex: guestIndex };
      },
      onDragEnter() {
        setIsDraggedOver(true);
      },
      onDragLeave() {
        setIsDraggedOver(false);
      },
      onDrop({ source }) {
        setIsDraggedOver(false);
        const fromIndex = source.data.fromIndex as number;
        const toIndex = guestIndex;
        if (fromIndex !== toIndex) {
          onReorder(fromIndex, toIndex);
        }
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [guest.id, guestIndex, onReorder]);

  return (
    <div
      ref={itemRef}
      className={cn(
        "relative p-0.5 rounded-lg border cursor-move transition-all hover:shadow-md",
        isBeingDragged && "opacity-50 scale-95",
        isDraggedOver && "bg-indigo-50 border-indigo-300",
        isDeclined && "bg-gray-50 opacity-60 border-gray-300",
        !isDraggedOver &&
          !isDeclined &&
          !guest.family_color &&
          "bg-white border-gray-200 hover:border-gray-300",
        !isDraggedOver &&
          !isDeclined &&
          guest.family_color &&
          "border-gray-200 hover:border-gray-300"
      )}
      style={{
        backgroundColor: getFadedBackgroundColor(),
      }}
    >
      <div className="flex items-center justify-between space-x-0.5">
        <div className="flex items-center space-x-0.5 flex-1 min-w-0">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center font-semibold text-[8px] flex-shrink-0"
            style={{
              backgroundColor: isDeclined ? "#9CA3AF" : getCategoryColor(),
              color: isDeclined ? "#FFFFFF" : getTextColor(getCategoryColor()),
            }}
          >
            {index}
          </div>
          <div className="font-medium text-xs text-gray-900 truncate flex-1">
            {guest.name}
          </div>
        </div>

        {/* Controls group */}
        <div className="flex items-center space-x-0.5 flex-shrink-0">
          {/* Family color picker */}
          {showColorPicker && (
            <GuestColorPicker
              currentColor={guest.family_color}
              guestIndex={guestIndex}
              guests={guests}
              onColorChange={(color) => onColorChange(guest.id, color)}
              disabled={isDeclined}
              size="sm"
            />
          )}

          {/* +1 button */}
          {showPlusOneButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => onClone(guest)}
                    className={cn(
                      "h-6 px-1 cursor-pointer text-xs font-semibold",
                      isDeclined && "opacity-50 text-gray-400 hover:text-gray-500"
                    )}
                  >
                    +1
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add +1</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Delete button */}
          {showDeleteButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(guest.id)}
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      isDeclined
                        ? "text-gray-400 hover:text-gray-500"
                        : "text-red-600 hover:text-red-700"
                    )}
                  >
                    <Trash2 className={cn(
                      "h-3 w-3",
                      isDeclined && "text-gray-400"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Drag indicator */}
          <div className="opacity-30">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
