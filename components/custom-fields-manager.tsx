"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type {
  CustomFieldConfig,
  CustomFieldOption,
  CustomFieldCardType,
} from "@/lib/types";

interface CustomFieldsManagerProps {
  fields: CustomFieldConfig[];
  onChange: (fields: CustomFieldConfig[]) => void;
}

export function CustomFieldsManager({
  fields,
  onChange,
}: CustomFieldsManagerProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const addField = () => {
    const newField: CustomFieldConfig = {
      id: `field-${Date.now()}`,
      label: "New Field",
      type: "text",
      order: fields.length,
    };
    onChange([...fields, newField]);
    setExpandedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<CustomFieldConfig>) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[index],
    ];

    // Update order values
    newFields.forEach((field, i) => {
      field.order = i;
    });

    onChange(newFields);
  };

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const newOption: CustomFieldOption = {
      id: `option-${Date.now()}`,
      label: "New Option",
      value: `option-${Date.now()}`,
    };

    updateField(fieldId, {
      options: [...(field.options || []), newOption],
    });
  };

  const updateOption = (
    fieldId: string,
    optionId: string,
    updates: Partial<CustomFieldOption>
  ) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !field.options) return;

    updateField(fieldId, {
      options: field.options.map((opt) =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ),
    });
  };

  const removeOption = (fieldId: string, optionId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !field.options) return;

    updateField(fieldId, {
      options: field.options.filter((opt) => opt.id !== optionId),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Fields</h3>
        <Button onClick={addField} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <Card key={field.id} className="overflow-hidden">
            <CardHeader
              className="p-3 cursor-pointer"
              onClick={() =>
                setExpandedField(expandedField === field.id ? null : field.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{field.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({field.type})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveField(field.id, "up");
                    }}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveField(field.id, "down");
                    }}
                    disabled={index === fields.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(field.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedField === field.id && (
              <CardContent className="p-3 pt-0 space-y-3">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`label-${field.id}`}>Field Label</Label>
                      <Input
                        id={`label-${field.id}`}
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                        placeholder="Enter field label"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`type-${field.id}`}>Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: CustomFieldConfig["type"]) =>
                          updateField(field.id, { type: value })
                        }
                      >
                        <SelectTrigger id={`type-${field.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="single-select">
                            Single Select
                          </SelectItem>
                          <SelectItem value="multi-select">
                            Multi Select
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`display-order-${field.id}`}>
                      Column Position (0 = first column, leave empty for
                      default)
                    </Label>
                    <Input
                      id={`display-order-${field.id}`}
                      type="number"
                      min="0"
                      value={field.displayOrder ?? ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          displayOrder: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Leave empty to show after status"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`card-type-${field.id}`}>
                      Statistics Card
                    </Label>
                    <Select
                      value={field.cardType || "none"}
                      onValueChange={(value: CustomFieldCardType) =>
                        updateField(field.id, { cardType: value })
                      }
                    >
                      <SelectTrigger id={`card-type-${field.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No card</SelectItem>
                        {field.type === "multi-select" && (
                          <SelectItem value="at-least-one">
                            Count: At least one option selected
                          </SelectItem>
                        )}
                        {(field.type === "single-select" ||
                          field.type === "multi-select") && (
                          <>
                            <SelectItem value="total-count">
                              Count: Total selections
                            </SelectItem>
                            <SelectItem value="most-popular">
                              Most popular option
                            </SelectItem>
                            <SelectItem value="options-breakdown">
                              Count: Options breakdown
                            </SelectItem>
                          </>
                        )}
                        {(field.type === "text" || field.type === "number") && (
                          <SelectItem value="filled-count">
                            Count: Fields with values
                          </SelectItem>
                        )}
                        {field.type === "number" && (
                          <SelectItem value="average">Average value</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(field.type === "text" || field.type === "number") && (
                  <div>
                    <Label htmlFor={`placeholder-${field.id}`}>
                      Placeholder
                    </Label>
                    <Input
                      id={`placeholder-${field.id}`}
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        updateField(field.id, { placeholder: e.target.value })
                      }
                      placeholder="Enter placeholder text"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`required-${field.id}`}
                    checked={field.required || false}
                    onCheckedChange={(checked: boolean) =>
                      updateField(field.id, { required: checked })
                    }
                  />
                  <Label htmlFor={`required-${field.id}`}>Required field</Label>
                </div>

                {(field.type === "single-select" ||
                  field.type === "multi-select") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(field.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-1">
                      {field.options?.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              updateOption(field.id, option.id, {
                                label: e.target.value,
                                value: e.target.value
                                  .toLowerCase()
                                  .replace(/\s+/g, "-"),
                              })
                            }
                            placeholder="Option label"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOption(field.id, option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No custom fields yet. Click &quot;Add Field&quot; to create one.
        </div>
      )}
    </div>
  );
}
