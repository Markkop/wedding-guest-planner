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
  partner1_label: string;
  partner1_initial: string;
  partner2_label: string;
  partner2_initial: string;
  created_at: Date;
  updated_at: Date;
};

export type Guest = {
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
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: Date;
};