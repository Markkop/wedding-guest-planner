'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestActionsCellProps {
  onMoveToEnd: () => void;
  onDelete: () => void;
  isDeclined?: boolean;
}

export function GuestActionsCell({ onMoveToEnd, onDelete, isDeclined = false }: GuestActionsCellProps) {
  return (
    <div className="flex gap-1">          
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onMoveToEnd}
              className={cn(
                "h-7 w-7 cursor-pointer",
                isDeclined && "opacity-50 text-gray-400 hover:text-gray-500"
              )}
            >
              <ArrowDown className={cn(
                "h-4 w-4",
                isDeclined && "text-gray-400"
              )} />
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
              className={cn(
                "h-7 w-7 cursor-pointer",
                isDeclined 
                  ? "text-gray-400 hover:text-gray-500" 
                  : "text-red-600 hover:text-red-700"
              )}
            >
              <Trash2 className={cn(
                "h-4 w-4",
                isDeclined && "text-gray-400"
              )} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}