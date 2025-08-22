'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowDown, Trash2 } from 'lucide-react';

interface GuestActionsCellProps {
  onMoveToEnd: () => void;
  onDelete: () => void;
}

export function GuestActionsCell({ onMoveToEnd, onDelete }: GuestActionsCellProps) {
  return (
    <div className="flex gap-1">          
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onMoveToEnd}
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
              onClick={onDelete}
              className="h-7 w-7 text-red-600 hover:text-red-700 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}