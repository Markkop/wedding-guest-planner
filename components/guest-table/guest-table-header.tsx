"use client";

import { TableHead, TableRow } from "@/components/ui/table";
import { useColumnOrder, COLUMN_HEAD_CLASSES } from "./use-column-order";
import type { Organization, VisibleColumns } from "@/lib/types";

interface Props {
  organization: Organization;
  visibleColumns: VisibleColumns;
}

export function GuestTableHeader({ organization, visibleColumns }: Props) {
  const { keys, customFieldMap } = useColumnOrder(organization, visibleColumns);

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
        const label = customFieldMap[id]?.label ?? "";
        return (
          <TableHead key={key} className={COLUMN_HEAD_CLASSES.custom}>
            {label}
          </TableHead>
        );
      })}
    </TableRow>
  );
}
