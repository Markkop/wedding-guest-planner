"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestNameCellProps {
  name: string;
  isDeclined: boolean;
  onUpdate: (name: string) => void;
}

export function GuestNameCell({
  name,
  isDeclined,
  onUpdate,
}: GuestNameCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleSave = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== name) {
      onUpdate(trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="h-8"
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          className={cn(
            "cursor-pointer",
            isDeclined && "opacity-50 text-gray-400"
          )}
        >
          <Check className={cn(
            "h-4 w-4",
            isDeclined && "text-gray-400"
          )} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          className={cn(
            "cursor-pointer",
            isDeclined && "opacity-50 text-gray-400"
          )}
        >
          <X className={cn(
            "h-4 w-4",
            isDeclined && "text-gray-400"
          )} />
        </Button>
      </div>
    );
  }

  const truncatedName = name.length > 10 ? `${name.slice(0, 10)}...` : name;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          isDeclined && "line-through text-gray-500",
          "cursor-pointer md:cursor-default"
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className="md:hidden">{truncatedName}</span>
        <span className="hidden md:inline">{name}</span>
      </span>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className={cn(
          "h-6 w-6 cursor-pointer hidden md:block",
          isDeclined && "opacity-50 text-gray-400 hover:text-gray-500"
        )}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
