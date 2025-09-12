"use client";

import { useState, useEffect, useRef } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import { GuestNameCell } from "./guest-table/guest-name-cell";
import { GuestActionsCell } from "./guest-table/guest-actions-cell";
import { CustomFieldCell } from "./guest-table/custom-field-cell";
import { useColumnOrder } from "./guest-table/use-column-order";
import { getFoodIcon } from "@/lib/utils/food-icons";
import type { Guest, VisibleColumns, Organization } from "@/lib/types";

interface SortableRowProps {
  guest: Guest;
  index: number;
  guestIndex: number;
  guests: Guest[]; // Added for color picker
  visibleColumns: VisibleColumns;
  organization: Organization;
  isRemotelyUpdated?: boolean;
  onUpdate: (guestId: string, updates: Partial<Guest>) => void;
  onDelete: (guestId: string) => void;
  onClone: (guest: Guest) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onMoveToEnd: (guestId: string) => void;
}

export function SortableRow({
  guest,
  index,
  guestIndex,
  guests,
  visibleColumns,
  organization,
  isRemotelyUpdated = false,
  onUpdate,
  onDelete,
  onClone,
  onReorder,
  onMoveToEnd,
}: SortableRowProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  const rowRef = useRef<HTMLTableRowElement | null>(null);

  const config = organization.configuration || {
    categories: [],
    ageGroups: { enabled: false, groups: [] },
    foodPreferences: { enabled: false, options: [] },
    confirmationStages: { enabled: false, stages: [] },
  };

  useEffect(() => {
    const rowElement = rowRef.current;
    if (!rowElement) return;

    // Make the table row draggable
    const cleanupDraggable = draggable({
      element: rowElement,
      getInitialData: () => ({
        type: "GUEST_ROW",
        guestId: guest.id,
        fromIndex: guestIndex,
      }),
      onGenerateDragPreview({ nativeSetDragImage }) {
        // Use the row element for the drag preview
        nativeSetDragImage?.(rowElement, 20, 20);
      },
      onDragStart() {
        setIsBeingDragged(true);
      },
      onDrop() {
        setIsBeingDragged(false);
      },
    });

    // Make the row a drop target
    const cleanupDropTarget = dropTargetForElements({
      element: rowElement,
      canDrop({ source }) {
        return (
          source.data.type === "GUEST_ROW" && source.data.guestId !== guest.id
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

  const handleNameUpdate = (name: string) => {
    onUpdate(guest.id, { name });
  };

  const handleColorChange = (color: string | null) => {
    onUpdate(guest.id, { family_color: color || undefined });
  };

  const toggleCategory = (categoryId: string) => {
    const allowMultiple = config.categoriesConfig?.allowMultiple ?? false;

    if (allowMultiple) {
      const newCategories = guest.categories.includes(categoryId)
        ? guest.categories.filter((id) => id !== categoryId)
        : [...guest.categories, categoryId];

      // Ensure at least one category is always selected
      if (newCategories.length === 0) {
        return;
      }

      onUpdate(guest.id, { categories: newCategories });
    } else {
      // Single selection mode - only allow one category
      onUpdate(guest.id, { categories: [categoryId] });
    }
  };

  const updateAgeGroup = (ageGroupId: string) => {
    onUpdate(guest.id, { age_group: ageGroupId });
  };

  const updateFoodPreference = (foodPrefId: string) => {
    const allowMultiple = config.foodPreferences?.allowMultiple ?? true;

    if (allowMultiple) {
      const currentPreferences = guest.food_preferences || [];
      const newPreferences = currentPreferences.includes(foodPrefId)
        ? currentPreferences.filter((id) => id !== foodPrefId)
        : [...currentPreferences, foodPrefId];

      onUpdate(guest.id, { food_preferences: newPreferences });
    } else {
      onUpdate(guest.id, { food_preference: foodPrefId });
    }
  };

  const updateConfirmationStage = (stageId: string) => {
    onUpdate(guest.id, { confirmation_stage: stageId });
  };

  const cycleConfirmationStage = () => {
    const sortedStages = config.confirmationStages.stages.sort(
      (a, b) => a.order - b.order
    );
    const currentIndex = sortedStages.findIndex(
      (stage) => stage.id === guest.confirmation_stage
    );
    const nextIndex = (currentIndex + 1) % sortedStages.length;
    updateConfirmationStage(sortedStages[nextIndex].id);
  };

  const handleMoveToEnd = () => {
    onMoveToEnd(guest.id);
  };

  const getConfirmationStageInfo = (stageId: string) => {
    const stage = config.confirmationStages.stages.find(
      (s) => s.id === stageId
    );
    if (!stage) return { label: stageId, order: 0 };
    return stage;
  };

  const isDeclined = guest.confirmation_stage === "declined";

  // Get confirmation stage styling
  const getConfirmationStageButtonStyle = (stageId: string) => {
    switch (stageId) {
      case "listed":
        return {
          variant: "outline" as const,
          className: "border-gray-400 text-gray-600 hover:bg-gray-50",
        };
      case "invited":
        return {
          variant: "default" as const,
          className: "bg-yellow-500 hover:bg-yellow-600 text-white",
        };
      case "confirmed_1":
      case "confirmed_2":
      case "confirmed_3":
        return {
          variant: "default" as const,
          className:
            stageId === "confirmed_1"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : stageId === "confirmed_2"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-green-700 hover:bg-green-800 text-white",
        };
      case "declined":
        return {
          variant: "outline" as const,
          className: "border-gray-400 text-gray-500 hover:bg-gray-50",
        };
      default:
        return {
          variant: "secondary" as const,
          className: "",
        };
    }
  };

  // Categories cell
  const categoriesCell = visibleColumns.categories ? (
    <TableCell key="categories">
      <div className="flex gap-1 justify-start min-w-max">
        {(config.categories || []).map((category) => (
          <TooltipProvider key={category.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={
                    guest.categories.includes(category.id)
                      ? "default"
                      : "outline"
                  }
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "h-7 min-w-7 p-0 cursor-pointer",
                    isDeclined && "opacity-50 grayscale"
                  )}
                  style={{
                    backgroundColor: guest.categories.includes(category.id)
                      ? isDeclined
                        ? "#9CA3AF"
                        : category.color
                      : undefined,
                    borderColor: guest.categories.includes(category.id)
                      ? isDeclined
                        ? "#9CA3AF"
                        : category.color
                      : isDeclined
                      ? "#9CA3AF"
                      : undefined,
                    color:
                      isDeclined && guest.categories.includes(category.id)
                        ? "#ffffff"
                        : undefined,
                  }}
                >
                  {category.initial}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{category.label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </TableCell>
  ) : null;

  // Age cell
  const ageCell =
    visibleColumns.age && config.ageGroups.enabled ? (
      <TableCell key="age">
        <div className="flex gap-1">
          {(config.ageGroups?.groups || []).map((ageGroup) => {
            const isSelected = guest.age_group === ageGroup.id;
            return (
              <TooltipProvider key={ageGroup.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => updateAgeGroup(ageGroup.id)}
                      className="h-7 min-w-7 p-0 text-xs cursor-pointer"
                      style={{
                        backgroundColor: isSelected
                          ? isDeclined
                            ? "#9CA3AF"
                            : undefined
                          : undefined,
                        borderColor: isDeclined ? "#9CA3AF" : undefined,
                        color: isDeclined
                          ? isSelected
                            ? "#ffffff"
                            : "#6B7280"
                          : undefined,
                      }}
                    >
                      {ageGroup.minAge
                        ? ageGroup.minAge
                        : ageGroup.label.slice(0, 2)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{ageGroup.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </TableCell>
    ) : null;

  // Food cell
  const foodCell =
    visibleColumns.food && config.foodPreferences.enabled ? (
      <TableCell key="food">
        <div className="flex gap-1">
          {(config.foodPreferences?.options || []).map((foodPref) => {
            const allowMultiple = config.foodPreferences?.allowMultiple ?? true;
            const isSelected = allowMultiple
              ? (guest.food_preferences || []).includes(foodPref.id)
              : guest.food_preference === foodPref.id;

            return (
              <TooltipProvider key={foodPref.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => updateFoodPreference(foodPref.id)}
                      className="h-7 w-7 p-0 cursor-pointer"
                      style={{
                        backgroundColor: isSelected
                          ? isDeclined
                            ? "#9CA3AF"
                            : undefined
                          : undefined,
                        borderColor: isDeclined ? "#9CA3AF" : undefined,
                      }}
                    >
                      {getFoodIcon(foodPref.id, isSelected, isDeclined)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{foodPref.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </TableCell>
    ) : null;

  // Confirmation cell
  const confirmationCell =
    visibleColumns.confirmations && config.confirmationStages.enabled ? (
      <TableCell key="confirmation">
        <Button
          size="sm"
          variant={
            getConfirmationStageButtonStyle(guest.confirmation_stage).variant
          }
          onClick={cycleConfirmationStage}
          className={cn(
            "h-8 min-w-20 cursor-pointer",
            getConfirmationStageButtonStyle(guest.confirmation_stage).className
          )}
        >
          {getConfirmationStageInfo(guest.confirmation_stage).label}
        </Button>
      </TableCell>
    ) : null;

  // Build cells array using column order hook
  const { keys, customFieldMap } = useColumnOrder(organization, visibleColumns);

  const buildCellsArray = () => {
    return keys
      .map((key) => {
        if (key === "index") {
          return (
            <TableCell key="index" className="font-medium pl-4">
              {index}
            </TableCell>
          );
        }

        if (key === "name") {
          return (
            <TableCell
              key="name"
              className={cn(
                "sticky left-0 z-10 border-r md:static md:border-r-0 w-auto md:min-w-[200px]",
                isBeingDragged
                  ? "bg-white opacity-50 md:bg-transparent"
                  : isDraggedOver
                  ? "bg-indigo-50 md:bg-indigo-50"
                  : isDeclined
                  ? "bg-gray-50 md:bg-gray-50"
                  : "bg-white md:bg-transparent"
              )}
            >
              <GuestNameCell
                name={guest.name}
                isDeclined={isDeclined}
                onUpdate={handleNameUpdate}
                guest={guest}
                guests={guests}
                guestIndex={guestIndex}
                onColorChange={handleColorChange}
              />
            </TableCell>
          );
        }

        if (key === "categories") return categoriesCell;
        if (key === "age") return ageCell;
        if (key === "food") return foodCell;
        if (key === "status") return confirmationCell;

        if (key === "actions") {
          return (
            <TableCell key="actions">
              <GuestActionsCell
                onMoveToEnd={handleMoveToEnd}
                onDelete={() => onDelete(guest.id)}
                onClone={() => onClone(guest)}
                isDeclined={isDeclined}
              />
            </TableCell>
          );
        }

        // Custom field
        if (key.startsWith("custom:")) {
          const fieldId = key.slice(7);
          const field = customFieldMap[fieldId];
          if (!field) return null;

          return (
            <TableCell key={key}>
              <CustomFieldCell
                fieldConfig={field}
                value={guest.custom_fields?.[fieldId]}
                isDeclined={isDeclined}
                onUpdate={(value) => {
                  const updatedCustomFields = {
                    ...(guest.custom_fields || {}),
                    [fieldId]: value,
                  };
                  onUpdate(guest.id, { custom_fields: updatedCustomFields });
                }}
              />
            </TableCell>
          );
        }

        return null;
      })
      .filter(Boolean);
  };

  return (
    <TableRow
      ref={rowRef}
      className={cn(
        "transition-all cursor-move hover:bg-gray-50",
        isBeingDragged && "opacity-50",
        isDraggedOver && "bg-indigo-50",
        isDeclined && "bg-gray-50 opacity-60",
        isRemotelyUpdated && "remote-update-highlight"
      )}
    >
      {buildCellsArray()}
    </TableRow>
  );
}
