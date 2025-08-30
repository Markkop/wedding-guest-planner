"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Guest, CustomFieldConfig } from "@/lib/types";

interface CustomFieldStatsCardsProps {
  guests: Guest[];
  customFields: CustomFieldConfig[];
}

export function CustomFieldStatsCards({
  guests,
  customFields,
}: CustomFieldStatsCardsProps) {
  const fieldsWithCards = customFields.filter(
    (field) => field.cardType && field.cardType !== "none"
  );

  if (fieldsWithCards.length === 0) {
    return null;
  }

  const calculateFieldStats = (field: CustomFieldConfig) => {
    const fieldData = guests.map((guest) => guest.custom_fields?.[field.id]);

    switch (field.cardType) {
      case "at-least-one": {
        // Count guests with at least one option selected (multi-select only)
        const count = fieldData.filter(
          (value) => Array.isArray(value) && value.length > 0
        ).length;
        return {
          title: field.label,
          value: count,
          subtitle: "",
        };
      }

      case "total-count": {
        // Total count of all selections across all guests
        let totalCount = 0;
        fieldData.forEach((value) => {
          if (Array.isArray(value)) {
            totalCount += value.length;
          } else if (value !== null && value !== undefined && value !== "") {
            totalCount += 1;
          }
        });
        return {
          title: field.label,
          value: totalCount,
          subtitle: "total selections",
        };
      }

      case "most-popular": {
        // Find the most selected option
        const optionCounts: { [key: string]: number } = {};

        fieldData.forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach((option) => {
              if (typeof option === "string") {
                optionCounts[option] = (optionCounts[option] || 0) + 1;
              }
            });
          } else if (typeof value === "string" && value) {
            optionCounts[value] = (optionCounts[value] || 0) + 1;
          }
        });

        const mostPopular = Object.entries(optionCounts).reduce(
          (max, [option, count]) =>
            count > max.count ? { option, count } : max,
          { option: "None", count: 0 }
        );

        // Find the label for this option
        const optionConfig = field.options?.find(
          (opt) => opt.value === mostPopular.option
        );
        const displayLabel = optionConfig?.label || mostPopular.option;

        return {
          title: field.label,
          value: `${displayLabel} (${mostPopular.count})`,
          subtitle: "most popular",
        };
      }

      case "filled-count": {
        // Count guests with any value (text/number fields)
        const count = fieldData.filter(
          (value) => value !== null && value !== undefined && value !== ""
        ).length;
        return {
          title: field.label,
          value: count,
          subtitle: "with values",
        };
      }

      case "average": {
        // Average value for number fields
        const numbers = fieldData
          .filter(
            (value) =>
              typeof value === "number" ||
              (typeof value === "string" && !isNaN(Number(value)))
          )
          .map((value) => Number(value));

        if (numbers.length === 0) {
          return {
            title: field.label,
            value: "N/A",
            subtitle: "average",
          };
        }

        const average =
          numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        return {
          title: field.label,
          value: average.toFixed(1),
          subtitle: "average",
        };
      }

      case "options-breakdown": {
        // Works for single-select and multi-select fields: show counts per option as "X / Y" and total in parentheses
        const optionCounts: Record<string, number> = {};

        field.options?.forEach((opt) => {
          optionCounts[opt.id] = 0;
        });

        fieldData.forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach((v) => {
              if (typeof v === "string") {
                optionCounts[v] = (optionCounts[v] || 0) + 1;
              }
            });
          } else if (typeof value === "string" && value) {
            optionCounts[value] = (optionCounts[value] || 0) + 1;
          }
        });

        // Build display string: counts in option order using label initial
        const optionStrings: string[] = [];
        let total = 0;
        field.options?.forEach((opt) => {
          const count = optionCounts[opt.value] || 0;
          total += count;
          optionStrings.push(String(count));
        });

        const display =
          optionStrings.join(" / ") +
          (field.options && field.options.length > 0 ? ` (${total})` : "");

        return {
          title: field.label,
          value: display,
          subtitle: "",
        };
      }

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {fieldsWithCards.map((field) => {
        const stats = calculateFieldStats(field);
        if (!stats) return null;

        return (
          <Card key={field.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stats.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.value}</div>
              <div className="text-xs text-muted-foreground">
                {stats.subtitle}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
