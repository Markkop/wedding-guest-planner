'use client';

import { useState, useEffect, useRef } from 'react';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuestNameCell } from './guest-table/guest-name-cell';
import { GuestActionsCell } from './guest-table/guest-actions-cell';
import { getFoodIcon } from '@/lib/utils/food-icons';
import type { Guest, VisibleColumns, EventConfiguration } from '@/lib/types';

interface Organization {
  id: string;
  name: string;
  event_type: string;
  configuration: EventConfiguration;
}

interface SortableRowProps {
  guest: Guest;
  index: number;
  guestIndex: number;
  visibleColumns: VisibleColumns;
  organization: Organization;
  onUpdate: (guestId: string, updates: Partial<Guest>) => void;
  onDelete: (guestId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onMoveToEnd: (guestId: string) => void;
}

export function SortableRow({
  guest,
  index,
  guestIndex,
  visibleColumns,
  organization,
  onUpdate,
  onDelete,
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
    confirmationStages: { enabled: false, stages: [] }
  };

  useEffect(() => {
    const rowElement = rowRef.current;
    if (!rowElement) return;

    // Make the table row draggable
    const cleanupDraggable = draggable({
      element: rowElement,
      getInitialData: () => ({
        type: 'GUEST_ROW',
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
        return source.data.type === 'GUEST_ROW' && source.data.guestId !== guest.id;
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

  const toggleCategory = (categoryId: string) => {
    const allowMultiple = config.categoriesConfig?.allowMultiple ?? false;
    
    if (allowMultiple) {
      const newCategories = guest.categories.includes(categoryId)
        ? guest.categories.filter(id => id !== categoryId)
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
        ? currentPreferences.filter(id => id !== foodPrefId)
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
    const sortedStages = config.confirmationStages.stages.sort((a, b) => a.order - b.order);
    const currentIndex = sortedStages.findIndex(stage => stage.id === guest.confirmation_stage);
    const nextIndex = (currentIndex + 1) % sortedStages.length;
    updateConfirmationStage(sortedStages[nextIndex].id);
  };

  const handleMoveToEnd = () => {
    onMoveToEnd(guest.id);
  };


  const getConfirmationStageInfo = (stageId: string) => {
    const stage = config.confirmationStages.stages.find(s => s.id === stageId);
    if (!stage) return { label: stageId, order: 0 };
    return stage;
  };

  const isDeclined = guest.confirmation_stage === 'declined';

  return (
    <TableRow
      ref={rowRef}
      className={cn(
        'transition-all cursor-move hover:bg-gray-50',
        isBeingDragged && 'opacity-50',
        isDraggedOver && 'bg-indigo-50',
        isDeclined && 'bg-gray-50 opacity-60'
      )}
    >
      <TableCell className="text-gray-400">
        <GripVertical className="h-4 w-4" />
      </TableCell>
      
      <TableCell className="font-medium">{index}</TableCell>
      
      <TableCell className={cn(
        "sticky left-0 z-10 border-r md:static md:border-r-0 w-auto md:min-w-[200px]",
        isBeingDragged ? 'bg-white opacity-50 md:bg-transparent' : 
        isDraggedOver ? 'bg-indigo-50 md:bg-indigo-50' : 
        isDeclined ? 'bg-gray-50 md:bg-gray-50' : 'bg-white md:bg-transparent'
      )}>
        <GuestNameCell 
          name={guest.name}
          isDeclined={isDeclined}
          onUpdate={handleNameUpdate}
        />
      </TableCell>
      
      {visibleColumns.categories && (
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {(config.categories || []).map((category) => (
              <TooltipProvider key={category.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={guest.categories.includes(category.id) ? 'default' : 'outline'}
                      onClick={() => toggleCategory(category.id)}
                      className="h-7 min-w-7 p-0 cursor-pointer"
                      style={{
                        backgroundColor: guest.categories.includes(category.id) ? category.color : undefined,
                        borderColor: category.color,
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
      )}
      
      {visibleColumns.age && config.ageGroups.enabled && (
        <TableCell>
          <div className="flex gap-1">
            {(config.ageGroups?.groups || []).map((ageGroup) => (
              <TooltipProvider key={ageGroup.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={guest.age_group === ageGroup.id ? 'default' : 'outline'}
                      onClick={() => updateAgeGroup(ageGroup.id)}
                      className="h-7 min-w-7 p-0 text-xs cursor-pointer"
                    >
                      {ageGroup.minAge ? ageGroup.minAge : ageGroup.label.slice(0, 2)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{ageGroup.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </TableCell>
      )}
      
      {visibleColumns.food && config.foodPreferences.enabled && (
        <TableCell>
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
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => updateFoodPreference(foodPref.id)}
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        {getFoodIcon(foodPref.id, isSelected)}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{foodPref.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </TableCell>
      )}
      
      {visibleColumns.confirmations && config.confirmationStages.enabled && (
        <TableCell>
          <Button
            size="sm"
            variant={guest.confirmation_stage === 'confirmed' ? 'default' : 
                    guest.confirmation_stage === 'declined' ? 'destructive' : 'secondary'}
            onClick={cycleConfirmationStage}
            className={cn(
              'h-8 min-w-20 cursor-pointer',
              guest.confirmation_stage === 'confirmed' && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {getConfirmationStageInfo(guest.confirmation_stage).label}
          </Button>
        </TableCell>
      )}
      
      <TableCell>
        <GuestActionsCell 
          onMoveToEnd={handleMoveToEnd}
          onDelete={() => onDelete(guest.id)}
        />
      </TableCell>
    </TableRow>
  );
}