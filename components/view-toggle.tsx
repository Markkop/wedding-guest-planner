"use client";

import { Button } from "@/components/ui/button";
import { Table, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = "table" | "grid";

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("table")}
        className={cn(
          "flex items-center gap-2",
          view === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"
        )}
      >
        <Table className="w-4 h-4" />
        <span className="hidden sm:inline">Table</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("grid")}
        className={cn(
          "flex items-center gap-2",
          view === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
        )}
      >
        <Grid3X3 className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );
}
