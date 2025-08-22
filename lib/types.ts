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
}

export interface EventConfiguration {
  categories: CategoryConfig[];
  ageGroups: {
    enabled: boolean;
    groups: AgeGroupConfig[];
  };
  foodPreferences: {
    enabled: boolean;
    options: FoodPreferenceConfig[];
  };
  confirmationStages: {
    enabled: boolean;
    stages: ConfirmationStageConfig[];
  };
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
  confirmation_stage: string;
  custom_fields: Record<string, unknown>;
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