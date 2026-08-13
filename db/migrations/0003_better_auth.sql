DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.users
    GROUP BY LOWER(TRIM(email))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enable Better Auth: users contain case-insensitive duplicate emails';
  END IF;
END $$;

UPDATE public.users
SET email = LOWER(TRIM(email));

UPDATE public.users
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL OR BTRIM(name) = '';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.users
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN password_hash SET DEFAULT 'oauth_managed';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
  ON public.users (LOWER(email));

CREATE TABLE IF NOT EXISTS public.accounts (
  id varchar(255) DEFAULT gen_random_uuid()::text NOT NULL PRIMARY KEY,
  user_id varchar(255) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  access_token text,
  refresh_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  id_token text,
  password text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider_id, account_id)
);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts (user_id);

CREATE TABLE IF NOT EXISTS public.sessions (
  id varchar(255) DEFAULT gen_random_uuid()::text NOT NULL PRIMARY KEY,
  user_id varchar(255) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions (user_id);

CREATE TABLE IF NOT EXISTS public.verifications (
  id varchar(255) DEFAULT gen_random_uuid()::text NOT NULL PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS verifications_identifier_idx
  ON public.verifications (identifier);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_updated_at') THEN
    CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_verifications_updated_at') THEN
    CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON public.verifications
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
