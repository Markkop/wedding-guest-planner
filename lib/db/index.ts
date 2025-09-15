import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const sql = neon(process.env.DATABASE_URL);

export type User = {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
};

export type Organization = {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  event_type: string;
  configuration: Record<string, unknown>; // JSONB
  created_at: Date;
  updated_at: Date;
};

export type Guest = {
  id: string;
  organization_id: string;
  name: string;
  categories: string[];
  age_group?: string;
  food_preference?: string;
  food_preferences?: string[];
  confirmation_stage: string;
  custom_fields: Record<string, unknown> | null; // JSONB
  family_color?: string; // Hex color for family/group identification
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: Date;
};