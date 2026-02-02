"use client";

import { TableHead, TableRow } from "@/components/ui/table";
import { useColumnOrder, COLUMN_HEAD_CLASSES } from "./use-column-order";
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

  const handleCopyColumnValues = async (fieldId: string) => {
    const values = guests
      .map((g) => g.custom_fields?.[fieldId])
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .join("\n");

    await navigator.clipboard.writeText(values);
    toast.success("Values copied to clipboard!");
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
                <button
                  type="button"
                  onClick={() => handleCopyColumnValues(id)}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy all values"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </TableHead>
        );
      })}
    </TableRow>
  );
}
