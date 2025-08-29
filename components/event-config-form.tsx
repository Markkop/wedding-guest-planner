'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { CustomFieldsManager } from '@/components/custom-fields-manager';
import type { 
  EventConfiguration, 
  EventTypePreset,
  CategoryConfig,
  AgeGroupConfig,
  FoodPreferenceConfig,
  ConfirmationStageConfig
} from '@/lib/types';

interface EventConfigFormProps {
  organizationId: string;
  initialConfig?: EventConfiguration;
  initialEventType?: string;
  onSave?: (config: EventConfiguration, eventType: string) => void;
}

export function EventConfigForm({ 
  organizationId, 
  initialConfig, 
  initialEventType = 'wedding',
  onSave 
}: EventConfigFormProps) {
  const [eventType, setEventType] = useState(initialEventType);
  const [presets, setPresets] = useState<EventTypePreset[]>([]);
  const [config, setConfig] = useState<EventConfiguration>(
    initialConfig || {
      categories: [],
      categoriesConfig: { allowMultiple: false },
      ageGroups: { enabled: false, groups: [] },
      foodPreferences: { enabled: false, allowMultiple: true, options: [] },
      confirmationStages: { enabled: true, stages: [] },
      customFields: []
    }
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPresets();
  }, []);

  const loadPresetConfig = useCallback(async (presetType: string) => {
    const preset = presets.find(p => p.name === presetType);
    if (preset) {
      setConfig(preset.default_config);
    }
  }, [presets]);

  useEffect(() => {
    if (!initialConfig && presets.length > 0) {
      loadPresetConfig(eventType);
    }
  }, [eventType, initialConfig, presets, loadPresetConfig]);

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/event-presets');
      const data = await response.json();
      if (response.ok) {
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  const handleEventTypeChange = (newEventType: string) => {
    setEventType(newEventType);
    if (newEventType !== 'custom') {
      loadPresetConfig(newEventType);
    }
  };

  const addCategory = () => {
    setConfig({
      ...config,
      categories: [
        ...config.categories,
        { id: '', label: '', initial: '', color: '#3b82f6' }
      ]
    });
  };

  const updateCategory = (index: number, field: keyof CategoryConfig, value: string) => {
    const newCategories = [...config.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setConfig({ ...config, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    if (config.categories.length <= 1) {
      toast.error('Must have at least one category');
      return;
    }
    setConfig({
      ...config,
      categories: config.categories.filter((_, i) => i !== index)
    });
  };

  const addAgeGroup = () => {
    setConfig({
      ...config,
      ageGroups: {
        ...config.ageGroups,
        groups: [
          ...config.ageGroups.groups,
          { id: '', label: '', minAge: undefined }
        ]
      }
    });
  };

  const updateAgeGroup = (index: number, field: keyof AgeGroupConfig, value: string | number | undefined) => {
    const newGroups = [...config.ageGroups.groups];
    newGroups[index] = { ...newGroups[index], [field]: value };
    setConfig({
      ...config,
      ageGroups: { ...config.ageGroups, groups: newGroups }
    });
  };

  const removeAgeGroup = (index: number) => {
    setConfig({
      ...config,
      ageGroups: {
        ...config.ageGroups,
        groups: config.ageGroups.groups.filter((_, i) => i !== index)
      }
    });
  };

  const addFoodOption = () => {
    setConfig({
      ...config,
      foodPreferences: {
        ...config.foodPreferences,
        options: [
          ...config.foodPreferences.options,
          { id: '', label: '' }
        ]
      }
    });
  };

  const updateFoodOption = (index: number, field: keyof FoodPreferenceConfig, value: string) => {
    const newOptions = [...config.foodPreferences.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setConfig({
      ...config,
      foodPreferences: { ...config.foodPreferences, options: newOptions }
    });
  };

  const removeFoodOption = (index: number) => {
    setConfig({
      ...config,
      foodPreferences: {
        ...config.foodPreferences,
        options: config.foodPreferences.options.filter((_, i) => i !== index)
      }
    });
  };

  const addConfirmationStage = () => {
    const maxOrder = Math.max(...config.confirmationStages.stages.map(s => s.order), -1);
    setConfig({
      ...config,
      confirmationStages: {
        ...config.confirmationStages,
        stages: [
          ...config.confirmationStages.stages,
          { id: '', label: '', order: maxOrder + 1 }
        ]
      }
    });
  };

  const updateConfirmationStage = (index: number, field: keyof ConfirmationStageConfig, value: string | number) => {
    const newStages = [...config.confirmationStages.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setConfig({
      ...config,
      confirmationStages: { ...config.confirmationStages, stages: newStages }
    });
  };

  const removeConfirmationStage = (index: number) => {
    if (config.confirmationStages.stages.length <= 1) {
      toast.error('Must have at least one confirmation stage');
      return;
    }
    setConfig({
      ...config,
      confirmationStages: {
        ...config.confirmationStages,
        stages: config.confirmationStages.stages.filter((_, i) => i !== index)
      }
    });
  };

  const handleSave = async () => {
    // Validation
    if (config.categories.length === 0) {
      toast.error('Must have at least one category');
      return;
    }

    for (const category of config.categories) {
      if (!category.id || !category.label || !category.initial) {
        toast.error('All category fields are required');
        return;
      }
    }

    if (config.confirmationStages.enabled && config.confirmationStages.stages.length === 0) {
      toast.error('Must have at least one confirmation stage when enabled');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          configuration: config
        })
      });

      if (response.ok) {
        toast.success('Configuration saved successfully');
        onSave?.(config, eventType);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-type">Choose Event Type</Label>
              <Select value={eventType} onValueChange={handleEventTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map(preset => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name.charAt(0).toUpperCase() + preset.name.slice(1)} - {preset.description}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Configuration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories/Hosts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={config.categoriesConfig?.allowMultiple ?? false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    categoriesConfig: { allowMultiple: !!checked }
                  })
                }
              />
              <span>Allow multiple category selection</span>
            </label>
            {config.categories.map((category, index) => (
              <div key={index} className="flex items-center space-x-2 p-4 border rounded">
                <Input
                  placeholder="ID (e.g., bride, family)"
                  value={category.id}
                  onChange={(e) => updateCategory(index, 'id', e.target.value)}
                />
                <Input
                  placeholder="Label (e.g., Bride)"
                  value={category.label}
                  onChange={(e) => updateCategory(index, 'label', e.target.value)}
                />
                <Input
                  placeholder="Initial"
                  value={category.initial}
                  maxLength={2}
                  className="w-16"
                  onChange={(e) => updateCategory(index, 'initial', e.target.value)}
                />
                <input
                  type="color"
                  value={category.color}
                  className="w-12 h-10"
                  onChange={(e) => updateCategory(index, 'color', e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeCategory(index)}
                  disabled={config.categories.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button onClick={addCategory} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Age Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Age Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={config.ageGroups.enabled}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    ageGroups: { ...config.ageGroups, enabled: !!checked }
                  })
                }
              />
              <span>Enable age groups</span>
            </label>
            
            {config.ageGroups.enabled && (
              <>
                {config.ageGroups.groups.map((group, index) => (
                  <div key={index} className="flex items-center space-x-2 p-4 border rounded">
                    <Input
                      placeholder="ID (e.g., adult)"
                      value={group.id}
                      onChange={(e) => updateAgeGroup(index, 'id', e.target.value)}
                    />
                    <Input
                      placeholder="Label (e.g., Adult)"
                      value={group.label}
                      onChange={(e) => updateAgeGroup(index, 'label', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Min Age"
                      value={group.minAge || ''}
                      onChange={(e) => updateAgeGroup(index, 'minAge', e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeAgeGroup(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addAgeGroup} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Age Group
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Food Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Food Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={config.foodPreferences.enabled}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    foodPreferences: { ...config.foodPreferences, enabled: !!checked }
                  })
                }
              />
              <span>Enable food preferences</span>
            </label>
            
            {config.foodPreferences.enabled && (
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={config.foodPreferences.allowMultiple ?? true}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      foodPreferences: { ...config.foodPreferences, allowMultiple: !!checked }
                    })
                  }
                />
                <span>Allow multiple food preference selection</span>
              </label>
            )}
            
            {config.foodPreferences.enabled && (
              <>
                {config.foodPreferences.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-4 border rounded">
                    <Input
                      placeholder="ID (e.g., vegetarian)"
                      value={option.id}
                      onChange={(e) => updateFoodOption(index, 'id', e.target.value)}
                    />
                    <Input
                      placeholder="Label (e.g., Vegetarian)"
                      value={option.label}
                      onChange={(e) => updateFoodOption(index, 'label', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFoodOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addFoodOption} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Food Option
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Stages */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={config.confirmationStages.enabled}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    confirmationStages: { ...config.confirmationStages, enabled: !!checked }
                  })
                }
              />
              <span>Enable confirmation stages</span>
            </label>
            
            {config.confirmationStages.enabled && (
              <>
                {config.confirmationStages.stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage, index) => (
                  <div key={index} className="flex items-center space-x-2 p-4 border rounded">
                    <Input
                      placeholder="ID (e.g., invited)"
                      value={stage.id}
                      onChange={(e) => updateConfirmationStage(index, 'id', e.target.value)}
                    />
                    <Input
                      placeholder="Label (e.g., Invited)"
                      value={stage.label}
                      onChange={(e) => updateConfirmationStage(index, 'label', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Order"
                      value={stage.order}
                      className="w-20"
                      onChange={(e) => updateConfirmationStage(index, 'order', Number(e.target.value))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeConfirmationStage(index)}
                      disabled={config.confirmationStages.stages.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addConfirmationStage} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Confirmation Stage
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomFieldsManager
            fields={config.customFields || []}
            onChange={(fields) => setConfig({ ...config, customFields: fields })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          {saving ? 'Saving...' : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}