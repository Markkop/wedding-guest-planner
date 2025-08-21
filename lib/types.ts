export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  partner1_label: string;
  partner1_initial: string;
  partner2_label: string;
  partner2_initial: string;
  created_at: Date;
  updated_at: Date;
  role?: 'admin' | 'member';
}

export interface Guest {
  id: string;
  organization_id: string;
  name: string;
  category: 'partner1' | 'partner2';
  age_group: 'adult' | '7years' | '11years';
  food_preference: 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free';
  confirmation_stage: number;
  declined: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface ColumnVisibility {
  category: boolean;
  age: boolean;
  food: boolean;
  confirmations: boolean;
}

export interface GuestStatistics {
  total: number;
  confirmed: number;
  partner1_count: number;
  partner2_count: number;
}