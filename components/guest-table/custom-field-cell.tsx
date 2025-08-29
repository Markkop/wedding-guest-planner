'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomFieldConfig } from '@/lib/types';

interface CustomFieldCellProps {
  fieldConfig: CustomFieldConfig;
  value: unknown;
  isDeclined: boolean;
  onUpdate: (value: unknown) => void;
}

export function CustomFieldCell({
  fieldConfig,
  value,
  isDeclined,
  onUpdate,
}: CustomFieldCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = () => {
    if (fieldConfig.type === 'text' || fieldConfig.type === 'number') {
      setEditValue(String(value || ''));
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (fieldConfig.type === 'number') {
      const numValue = editValue ? Number(editValue) : null;
      onUpdate(numValue);
    } else {
      onUpdate(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Render text or number field
  if (fieldConfig.type === 'text' || fieldConfig.type === 'number') {
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type={fieldConfig.type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 w-32"
            placeholder={fieldConfig.placeholder}
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-7 w-7 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div
        onClick={startEditing}
        className={cn(
          'cursor-pointer px-2 py-1 hover:bg-muted rounded min-w-[100px]',
          isDeclined && 'opacity-50'
        )}
      >
        {value !== null && value !== undefined && value !== '' ? (
          String(value)
        ) : (
          <span className="text-muted-foreground">
            {fieldConfig.placeholder || 'Click to edit'}
          </span>
        )}
      </div>
    );
  }

  // Render single select field
  if (fieldConfig.type === 'single-select') {
    return (
      <Select
        value={String(value || '')}
        onValueChange={onUpdate}
        disabled={isDeclined}
      >
        <SelectTrigger className="h-7 w-32">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {!fieldConfig.required && (
            <SelectItem value="">None</SelectItem>
          )}
          {fieldConfig.options?.map((option) => (
            <SelectItem key={option.id} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Render multi-select field
  if (fieldConfig.type === 'multi-select') {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="flex gap-1 flex-wrap">
        {fieldConfig.options?.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <TooltipProvider key={option.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => {
                      if (isSelected) {
                        onUpdate(
                          selectedValues.filter((v) => v !== option.value)
                        );
                      } else {
                        onUpdate([...selectedValues, option.value]);
                      }
                    }}
                    className={cn(
                      'h-7 px-2 text-xs',
                      isDeclined && 'opacity-50'
                    )}
                    disabled={isDeclined}
                  >
                    {option.label.slice(0, 3).toUpperCase()}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{option.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  return null;
}