'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface GridSettingsProps {
  dragPlusOne: boolean;
  dragFamilyTogether: boolean;
  showFamilyBgColor: boolean;
  showColorPicker: boolean;
  showDeleteButton: boolean;
  showPlusOneButton: boolean;
  onDragPlusOneChange: (checked: boolean) => void;
  onDragFamilyTogetherChange: (checked: boolean) => void;
  onShowFamilyBgColorChange: (checked: boolean) => void;
  onShowColorPickerChange: (checked: boolean) => void;
  onShowDeleteButtonChange: (checked: boolean) => void;
  onShowPlusOneButtonChange: (checked: boolean) => void;
}

export function GridSettings({
  dragPlusOne,
  dragFamilyTogether,
  showFamilyBgColor,
  showColorPicker,
  showDeleteButton,
  showPlusOneButton,
  onDragPlusOneChange,
  onDragFamilyTogetherChange,
  onShowFamilyBgColorChange,
  onShowColorPickerChange,
  onShowDeleteButtonChange,
  onShowPlusOneButtonChange,
}: GridSettingsProps) {
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
                checked={dragPlusOne}
                onCheckedChange={(checked) =>
                  onDragPlusOneChange(!!checked)
                }
              />
              <span className="text-sm">Drag +1 Together</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={dragFamilyTogether}
                onCheckedChange={(checked) =>
                  onDragFamilyTogetherChange(!!checked)
                }
              />
              <span className="text-sm">Drag Family Together</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={showFamilyBgColor}
                onCheckedChange={(checked) =>
                  onShowFamilyBgColorChange(!!checked)
                }
              />
              <span className="text-sm">Show Family BG Color</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={showColorPicker}
                onCheckedChange={(checked) =>
                  onShowColorPickerChange(!!checked)
                }
              />
              <span className="text-sm">Show Color Picker</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={showDeleteButton}
                onCheckedChange={(checked) =>
                  onShowDeleteButtonChange(!!checked)
                }
              />
              <span className="text-sm">Show Delete Button</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={showPlusOneButton}
                onCheckedChange={(checked) =>
                  onShowPlusOneButtonChange(!!checked)
                }
              />
              <span className="text-sm">Show +1 Button</span>
            </label>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
