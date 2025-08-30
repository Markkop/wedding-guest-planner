"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomFieldCardStats } from "@/lib/utils/custom-field-stats";
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {fieldsWithCards.map((field) => {
        const stats = getCustomFieldCardStats(field, guests);
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
