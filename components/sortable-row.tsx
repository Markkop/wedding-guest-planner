'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  XCircle,
  User,
  Leaf,
  Wheat,
  Milk,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Guest {
  id: string;
  name: string;
  category: 'partner1' | 'partner2';
  age_group: 'adult' | '7years' | '11years';
  food_preference: 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free';
  confirmation_stage: number;
  declined: boolean;
  display_order: number;
}

interface VisibleColumns {
  category: boolean;
  age: boolean;
  food: boolean;
  confirmation: boolean;
}

interface Organization {
  id: string;
  name: string;
  partner1_label?: string;
  partner1_initial?: string;
  partner2_label?: string;
  partner2_initial?: string;
}

interface SortableRowProps {
  guest: Guest;
  index: number;
  visibleColumns: VisibleColumns;
  organization: Organization;
  onUpdate: (guestId: string, updates: Partial<Guest>) => void;
  onDelete: (guestId: string) => void;
}

export function SortableRow({
  guest,
  index,
  visibleColumns,
  organization,
  onUpdate,
  onDelete,
}: SortableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: guest.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  const cycleConfirmation = () => {
    const nextStage = (guest.confirmation_stage + 1) % 4;
    onUpdate(guest.id, { confirmation_stage: nextStage });
  };

  const toggleDeclined = () => {
    onUpdate(guest.id, { declined: !guest.declined });
  };

  const moveToEnd = async () => {
    try {
      await fetch(`/api/guests/${guest.id}/move-to-end`, { method: 'POST' });
      window.location.reload();
    } catch {
    }
  };

  const getFoodIcon = (preference: string) => {
    switch (preference) {
      case 'vegetarian': return <Leaf className="h-4 w-4 text-green-600" />;
      case 'vegan': return <Leaf className="h-4 w-4 text-green-700" />;
      case 'gluten_free': return <Wheat className="h-4 w-4 text-amber-600" />;
      case 'dairy_free': return <Milk className="h-4 w-4 text-blue-600" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };


  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50',
        guest.declined && 'bg-gray-50 opacity-60'
      )}
    >
      <TableCell className="cursor-move">
        <div {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
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
            <Button size="icon" variant="ghost" onClick={handleSaveName}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={cn(guest.declined && 'line-through')}>
              {guest.name}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
      </TableCell>
      
      {visibleColumns.category && (
        <TableCell>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={guest.category === 'partner1' ? 'default' : 'outline'}
                    onClick={() => onUpdate(guest.id, { category: 'partner1' })}
                    className="h-7 w-7 p-0"
                  >
                    {organization.partner1_initial}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{organization.partner1_label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={guest.category === 'partner2' ? 'default' : 'outline'}
                    onClick={() => onUpdate(guest.id, { category: 'partner2' })}
                    className="h-7 w-7 p-0"
                  >
                    {organization.partner2_initial}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{organization.partner2_label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      )}
      
      {visibleColumns.age && (
        <TableCell>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={guest.age_group === 'adult' ? 'default' : 'outline'}
                    onClick={() => onUpdate(guest.id, { age_group: 'adult' })}
                    className="h-7 w-7 p-0"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Adult</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={guest.age_group === '7years' ? 'default' : 'outline'}
                    onClick={() => onUpdate(guest.id, { age_group: '7years' })}
                    className="h-7 w-7 p-0"
                  >
                    7
                  </Button>
                </TooltipTrigger>
                <TooltipContent>7 years</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={guest.age_group === '11years' ? 'default' : 'outline'}
                    onClick={() => onUpdate(guest.id, { age_group: '11years' })}
                    className="h-7 w-7 p-0"
                  >
                    11
                  </Button>
                </TooltipTrigger>
                <TooltipContent>11 years</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      )}
      
      {visibleColumns.food && (
        <TableCell>
          <div className="flex gap-1">
            {['none', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'].map((pref) => (
              <TooltipProvider key={pref}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={guest.food_preference === pref ? 'default' : 'outline'}
                      onClick={() => onUpdate(guest.id, { food_preference: pref })}
                      className="h-7 w-7 p-0"
                    >
                      {getFoodIcon(pref)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {pref === 'none' ? 'No restrictions' :
                     pref === 'gluten_free' ? 'Gluten free' :
                     pref === 'dairy_free' ? 'Dairy free' :
                     pref.charAt(0).toUpperCase() + pref.slice(1)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </TableCell>
      )}
      
      {visibleColumns.confirmations && (
        <TableCell>
          <Button
            size="sm"
            variant={guest.confirmation_stage === 0 ? 'outline' : 
                    guest.confirmation_stage === 3 ? 'default' : 'secondary'}
            onClick={cycleConfirmation}
            className={cn(
              'h-8',
              guest.confirmation_stage === 3 && 'bg-green-600 hover:bg-green-700'
            )}
          >
            Confirmations {guest.confirmation_stage}/3
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
                  variant={guest.declined ? 'default' : 'ghost'}
                  onClick={toggleDeclined}
                  className="h-7 w-7"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Won&apos;t make it</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={moveToEnd}
                  className="h-7 w-7"
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
                  className="h-7 w-7 text-red-600 hover:text-red-700"
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