"use client";

import { useState } from "react";
import { TableHead, TableRow } from "@/components/ui/table";
import { useColumnOrder, COLUMN_HEAD_CLASSES } from "./use-column-order";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { Organization, VisibleColumns, Guest } from "@/lib/types";

interface Props {
  organization: Organization;
  visibleColumns: VisibleColumns;
  guests: Guest[];
}

export function GuestTableHeader({ organization, visibleColumns, guests }: Props) {
  const { keys, customFieldMap } = useColumnOrder(organization, visibleColumns);
  const [openColumnId, setOpenColumnId] = useState<string | null>(null);

  const getTextValue = (value: unknown) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  };

  const getPreviousTextFieldId = (fieldId: string) => {
    const currentIndex = keys.indexOf(`custom:${fieldId}`);
    if (currentIndex <= 0) return null;
    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      const key = keys[i];
      if (!key.startsWith("custom:")) continue;
      const candidateId = key.slice(7);
      if (customFieldMap[candidateId]?.type === "text") {
        return candidateId;
      }
    }
    return null;
  };

  const handleCopyColumnValues = async (fieldId: string) => {
    const values = guests
      .map((g) => getTextValue(g.custom_fields?.[fieldId]))
      .filter((v): v is string => v !== "")
      .join("\n");

    await navigator.clipboard.writeText(values);
    toast.success("Values copied to clipboard!");
  };

  const handleCopyWithPrevious = async (fieldId: string) => {
    const previousTextFieldId = getPreviousTextFieldId(fieldId);
    const values = guests
      .map((g) => {
        const currentValue = getTextValue(g.custom_fields?.[fieldId]);
        if (!currentValue) return null;

        const previousValue = previousTextFieldId
          ? getTextValue(g.custom_fields?.[previousTextFieldId])
          : getTextValue(g.name);
        const left = previousValue || "<empty>";

        return `${left}: ${currentValue}`;
      })
      .filter((line): line is string => Boolean(line))
      .join("\n");

    await navigator.clipboard.writeText(values);
    toast.success("Values copied to clipboard!");
    setOpenColumnId(null);
  };

  return (
    <TableRow>
      {keys.map((key) => {
        if (key === "index")
          return (
            <TableHead key="index" className={COLUMN_HEAD_CLASSES.index}>
              #
            </TableHead>
          );
        if (key === "name")
          return (
            <TableHead key="name" className={COLUMN_HEAD_CLASSES.name}>
              Name
            </TableHead>
          );
        if (key === "categories")
          return (
            <TableHead
              key="categories"
              className={COLUMN_HEAD_CLASSES.categories}
            >
              Categories
            </TableHead>
          );
        if (key === "age")
          return (
            <TableHead key="age" className={COLUMN_HEAD_CLASSES.age}>
              Age
            </TableHead>
          );
        if (key === "food")
          return (
            <TableHead key="food" className={COLUMN_HEAD_CLASSES.food}>
              Food
            </TableHead>
          );
        if (key === "status")
          return (
            <TableHead key="status" className={COLUMN_HEAD_CLASSES.status}>
              Status
            </TableHead>
          );
        if (key === "actions")
          return (
            <TableHead key="actions" className={COLUMN_HEAD_CLASSES.actions}>
              Actions
            </TableHead>
          );

        const id = key.startsWith("custom:") ? key.slice(7) : "";
        const field = customFieldMap[id];
        const label = field?.label ?? "";
        const isTextField = field?.type === "text";

        return (
          <TableHead key={key} className={COLUMN_HEAD_CLASSES.custom}>
            <div className="flex items-center gap-1">
              <span>{label}</span>
              {isTextField && (
                <Popover
                  open={openColumnId === id}
                  onOpenChange={(nextOpen) =>
                    setOpenColumnId(nextOpen ? id : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleCopyColumnValues(id)}
                      className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy all values"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled
                        className="w-full rounded px-2 py-1.5 text-left text-sm text-muted-foreground"
                      >
                        Copy lines (already copied)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyWithPrevious(id)}
                        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                      >
                        Copy prev. text column + this column
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </TableHead>
        );
      })}
    </TableRow>
  );
}
