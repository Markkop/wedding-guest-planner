\pset tuples_only on
\pset format unaligned

WITH checks AS (
  SELECT 'accounts' AS table_name, count(*) AS row_count,
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), '')) AS digest
    FROM public.accounts t
  UNION ALL
  SELECT 'active_sessions', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), '')) AS digest
    FROM public.active_sessions t
  UNION ALL
  SELECT 'event_type_presets', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), ''))
    FROM public.event_type_presets t
  UNION ALL
  SELECT 'guests', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), ''))
    FROM public.guests t
  UNION ALL
  SELECT 'organization_members', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), ''))
    FROM public.organization_members t
  UNION ALL
  SELECT 'organizations', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), ''))
    FROM public.organizations t
  UNION ALL
  SELECT 'sessions', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), ''))
    FROM public.sessions t
  UNION ALL
  SELECT 'users', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), ''))
    FROM public.users t
  UNION ALL
  SELECT 'verifications', count(*),
    md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY id::text), ''))
    FROM public.verifications t
)
SELECT 'DATA|' || table_name || '|' || row_count || '|' || digest
FROM checks
ORDER BY table_name;

WITH schema_objects AS (
  SELECT 'column' AS object_type,
    table_name || '|' || column_name AS object_name,
    data_type || '|' || is_nullable || '|' || coalesce(column_default, '') AS definition
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name <> 'app_schema_migrations'

  UNION ALL

  SELECT 'constraint', c.relname || '|' || con.conname,
    pg_get_constraintdef(con.oid, true)
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname <> 'app_schema_migrations'

  UNION ALL

  SELECT 'index', tablename || '|' || indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename <> 'app_schema_migrations'

  UNION ALL

  SELECT 'function', p.proname, pg_get_functiondef(p.oid)
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'

  UNION ALL

  SELECT 'trigger', c.relname || '|' || t.tgname, pg_get_triggerdef(t.oid, true)
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal
)
SELECT 'SCHEMA|' || md5(string_agg(
  object_type || '|' || object_name || '|' || definition,
  E'\n' ORDER BY object_type, object_name, definition
))
FROM schema_objects;
