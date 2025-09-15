"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSuggestedColors, getContrastTextColor, pickRandomColor } from "@/lib/utils/colors";
import type { Guest } from "@/lib/types";

interface GuestColorPickerProps {
  currentColor?: string;
  guestIndex: number;
  guests: Guest[];
  onColorChange: (color: string | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function GuestColorPicker({
  currentColor,
  guestIndex,
  guests,
  onColorChange,
  disabled = false,
  size = "md",
  className,
}: GuestColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get suggested colors based on guest position
  const suggestedColors = getSuggestedColors(guestIndex, guests);

  // Size configurations
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setIsOpen(false);
  };

  const handleClearColor = () => {
    onColorChange(null);
    setIsOpen(false);
  };

  const handleRandomColor = () => {
    const randomColor = pickRandomColor(guests);
    onColorChange(randomColor);
    setIsOpen(false);
  };

  // Default color if none selected
  const displayColor = currentColor || "#E5E7EB"; // gray-200
  const hasColor = Boolean(currentColor);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className={cn(
                  "rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors",
                  sizeClasses[size],
                  disabled && "opacity-50 cursor-not-allowed",
                  className
                )}
                style={{ backgroundColor: displayColor }}
              >
                {!hasColor && (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                  </div>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Family Color</h4>
                  {hasColor && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearColor}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-48">
                  <div className="grid grid-cols-8 gap-2 p-1">
                    {/* Random color option as first choice */}
                    <button
                      onClick={handleRandomColor}
                      className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 hover:border-gray-600 transition-all hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      title="Pick random color (prioritizes unused colors)"
                    >
                      <span className="text-gray-600 font-bold text-sm">?</span>
                    </button>

                    {suggestedColors.map((color, index) => {
                      const isSelected = color === currentColor;
                      const textColor = getContrastTextColor(color);

                      return (
                        <button
                          key={`${color}-${index}`}
                          onClick={() => handleColorSelect(color)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                            isSelected
                              ? "border-gray-900 ring-2 ring-gray-900"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {isSelected && (
                            <div
                              className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ color: textColor }}
                            >
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="text-xs text-gray-500">
                  Random option prioritizes unused colors. Used colors shown first (closest guests first), then remaining colors.
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent>
          {hasColor ? "Change family color" : "Set family color"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
