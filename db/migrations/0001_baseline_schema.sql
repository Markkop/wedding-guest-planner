CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.users (
  id varchar(255) DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  name varchar(255),
  avatar_url varchar(255),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  tier varchar(10) DEFAULT 'free' NOT NULL,
  ai_messages_used_today integer DEFAULT 0 NOT NULL,
  ai_messages_reset_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_super_admin boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name varchar NOT NULL,
  invite_code varchar NOT NULL UNIQUE,
  admin_id varchar(255) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type varchar DEFAULT 'custom',
  configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid NOT NULL,
  user_id varchar(255) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role varchar(20) DEFAULT 'member',
  joined_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.guests (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  categories text[] DEFAULT '{}'::text[],
  age_group varchar,
  food_preference varchar,
  confirmation_stage varchar DEFAULT 'invited',
  custom_fields jsonb DEFAULT '{}'::jsonb,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(255) REFERENCES public.users(id),
  food_preferences jsonb DEFAULT '[]'::jsonb,
  family_color varchar(7) CHECK (family_color IS NULL OR family_color ~ '^#[0-9a-fA-F]{6}$')
);

CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id varchar(255) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  last_activity timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS public.event_type_presets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name varchar NOT NULL,
  description text,
  default_config jsonb NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_org ON public.active_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_guests_display_order ON public.guests (organization_id, display_order);
CREATE INDEX IF NOT EXISTS idx_guests_organization ON public.guests (organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_event_type ON public.organizations (event_type);
CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON public.organizations (invite_code);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
