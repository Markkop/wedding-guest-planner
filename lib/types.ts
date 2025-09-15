export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Configuration Types
export interface CategoryConfig {
  id: string;
  label: string;
  initial: string;
  color: string;
}

export interface AgeGroupConfig {
  id: string;
  label: string;
  minAge?: number;
}

export interface FoodPreferenceConfig {
  id: string;
  label: string;
}

export interface ConfirmationStageConfig {
  id: string;
  label: string;
  order: number;
  color?: string;
}

export interface CustomFieldOption {
  id: string;
  label: string;
  value: string;
}

export type CustomFieldCardType =
  | 'none'
  | 'at-least-one' // Shows count of guests with at least one option selected (multi-select only)
  | 'total-count' // Shows total count of all selections across all guests
  | 'most-popular' // Shows the most selected option and its count
  | 'filled-count' // Shows count of guests with any value (text/number fields)
  | 'average' // Shows average value (number fields only)
  | 'options-breakdown' // Shows counts for each option separated by / and total in parentheses

export interface CustomFieldConfig {
  id: string;
  label: string;
  type: 'single-select' | 'multi-select' | 'text' | 'number';
  options?: CustomFieldOption[]; // For select types
  required?: boolean;
  order?: number; // Order within custom fields
  displayOrder?: number; // Column position in table (0 = first, 1 = after name, etc.)
  placeholder?: string;
  cardType?: CustomFieldCardType; // What kind of statistics card to show
}

export interface EventConfiguration {
  categories: CategoryConfig[];
  categoriesConfig?: {
    allowMultiple: boolean;
  };
  ageGroups: {
    enabled: boolean;
    groups: AgeGroupConfig[];
  };
  foodPreferences: {
    enabled: boolean;
    allowMultiple?: boolean;
    options: FoodPreferenceConfig[];
  };
  confirmationStages: {
    enabled: boolean;
    stages: ConfirmationStageConfig[];
  };
  customFields?: CustomFieldConfig[];
}

export interface EventTypePreset {
  id: string;
  name: string;
  description?: string;
  default_config: EventConfiguration;
  created_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  event_type: string;
  configuration: EventConfiguration;
  created_at: Date;
  updated_at: Date;
  role?: 'admin' | 'member';
}

export interface Guest {
  id: string;
  organization_id: string;
  name: string;
  categories: string[];
  age_group?: string;
  food_preference?: string;
  food_preferences?: string[];
  confirmation_stage: string;
  custom_fields: Record<string, unknown>;
  family_color?: string | null; // Hex color for family/group identification
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface ColumnVisibility {
  categories: boolean;
  age: boolean;
  food: boolean;
  confirmations: boolean;
}

export interface GuestStatistics {
  total: number;
  confirmed: number;
  invited: number;
  declined: number;
  byCategory: Record<string, number>;
  byConfirmationStage: Record<string, number>;
}

// Additional shared interfaces for component props
export interface VisibleColumns {
  categories: boolean;
  age: boolean;
  food: boolean;
  confirmations: boolean;
}

export interface ExportData {
  version: string;
  exported_at: string;
  organization: {
    name: string;
    event_type: string;
    configuration: Record<string, unknown>;
    created_at: string;
  };
  guests: Array<{
    name: string;
    categories: string[];
    age_group?: string;
    food_preference?: string;
    confirmation_stage: string;
    custom_fields: Record<string, unknown>;
    family_color?: string;
    display_order: number;
  }>;
  members: Array<{
    email: string;
    name?: string;
    role: string;
    joined_at: string;
  }>;
  invite_code: string;
}