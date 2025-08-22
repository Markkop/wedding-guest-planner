'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import type { VisibleColumns, Organization } from '@/lib/types';

interface ColumnSettingsProps {
  visibleColumns: VisibleColumns;
  organization: Organization;
  onColumnsChange: (columns: VisibleColumns) => void;
}

export function ColumnSettings({ 
  visibleColumns, 
  organization, 
  onColumnsChange 
}: ColumnSettingsProps) {
  const updateColumn = (key: keyof VisibleColumns, checked: boolean) => {
    onColumnsChange({ ...visibleColumns, [key]: checked });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2">
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={visibleColumns.categories}
                onCheckedChange={(checked) =>
                  updateColumn('categories', !!checked)
                }
              />
              <span className="text-sm">Categories</span>
            </label>
            {organization.configuration?.ageGroups?.enabled && (
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={visibleColumns.age}
                  onCheckedChange={(checked) =>
                    updateColumn('age', !!checked)
                  }
                />
                <span className="text-sm">Age</span>
              </label>
            )}
            {organization.configuration?.foodPreferences?.enabled && (
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={visibleColumns.food}
                  onCheckedChange={(checked) =>
                    updateColumn('food', !!checked)
                  }
                />
                <span className="text-sm">Food Preference</span>
              </label>
            )}
            {organization.configuration?.confirmationStages?.enabled && (
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={visibleColumns.confirmations}
                  onCheckedChange={(checked) =>
                    updateColumn('confirmations', !!checked)
                  }
                />
                <span className="text-sm">Confirmations</span>
              </label>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}