'use client';

import { useState, useEffect, useRef } from 'react';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GripVertical,
  Pencil,
  Check,
  X,
  Trash2,
  ArrowDown,
  Leaf,
  Wheat,
  Milk,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface VisibleColumns {
  categories: boolean;
  age: boolean;
  food: boolean;
  confirmations: boolean;
}

interface CategoryConfig {
  id: string;
  label: string;
  initial: string;
  color: string;
}

interface AgeGroupConfig {
  id: string;
  label: string;
  minAge?: number;
}

interface FoodPreferenceConfig {
  id: string;
  label: string;
}

interface ConfirmationStageConfig {
  id: string;
  label: string;
  order: number;
}

interface EventConfiguration {
  categories: CategoryConfig[];
  ageGroups: {
    enabled: boolean;
    groups: AgeGroupConfig[];
  };
  foodPreferences: {
    enabled: boolean;
    options: FoodPreferenceConfig[];
  };
  confirmationStages: {
    enabled: boolean;
    stages: ConfirmationStageConfig[];
  };
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);
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

  const handleSaveName = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== guest.name) {
      onUpdate(guest.id, { name: trimmedName });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(guest.name);
    setIsEditing(false);
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = guest.categories.includes(categoryId)
      ? guest.categories.filter(id => id !== categoryId)
      : [...guest.categories, categoryId];
    
    // Ensure at least one category is always selected
    if (newCategories.length === 0) {
      return;
    }
    
    onUpdate(guest.id, { categories: newCategories });
  };

  const updateAgeGroup = (ageGroupId: string) => {
    onUpdate(guest.id, { age_group: ageGroupId });
  };

  const updateFoodPreference = (foodPrefId: string) => {
    onUpdate(guest.id, { food_preference: foodPrefId });
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

  const getFoodIcon = (prefId: string, isSelected: boolean) => {
    // Default icons based on common preference IDs
    const whiteClass = "h-4 w-4 text-white";
    switch (prefId.toLowerCase()) {
      case 'vegetarian': return <Leaf className={isSelected ? whiteClass : "h-4 w-4 text-green-600"} />;
      case 'vegan': return <Leaf className={isSelected ? whiteClass : "h-4 w-4 text-green-700"} />;
      case 'gluten_free': case 'gluten-free': return <Wheat className={isSelected ? whiteClass : "h-4 w-4 text-amber-600"} />;
      case 'dairy_free': case 'dairy-free': return <Milk className={isSelected ? whiteClass : "h-4 w-4 text-blue-600"} />;
      case 'none': case 'no_restrictions': return <Utensils className={isSelected ? whiteClass : "h-4 w-4"} />;
      default: return <Utensils className={isSelected ? whiteClass : "h-4 w-4"} />;
    }
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
      
      <TableCell>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="h-8"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSaveName} className="cursor-pointer">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="cursor-pointer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={cn(isDeclined && 'line-through')}>
              {guest.name}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
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
            {(config.foodPreferences?.options || []).map((foodPref) => (
              <TooltipProvider key={foodPref.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={guest.food_preference === foodPref.id ? 'default' : 'outline'}
                      onClick={() => updateFoodPreference(foodPref.id)}
                      className="h-7 w-7 p-0 cursor-pointer"
                    >
                      {getFoodIcon(foodPref.id, guest.food_preference === foodPref.id)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{foodPref.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
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
        <div className="flex gap-1">          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleMoveToEnd}
                  className="h-7 w-7 cursor-pointer"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move to end</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(guest.id)}
                  className="h-7 w-7 text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}