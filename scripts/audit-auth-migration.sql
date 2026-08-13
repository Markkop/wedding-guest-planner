\pset tuples_only on
\pset format unaligned

SELECT 'AUTH_AUDIT|users|' || COUNT(*) FROM public.users;

SELECT 'AUTH_AUDIT|blank_emails|' || COUNT(*)
FROM public.users
WHERE email IS NULL OR BTRIM(email) = '';

SELECT 'AUTH_AUDIT|blank_names|' || COUNT(*)
FROM public.users
WHERE name IS NULL OR BTRIM(name) = '';

SELECT 'AUTH_AUDIT|case_insensitive_duplicate_groups|' || COUNT(*)
FROM (
  SELECT LOWER(BTRIM(email))
  FROM public.users
  GROUP BY LOWER(BTRIM(email))
  HAVING COUNT(*) > 1
) duplicates;

SELECT 'AUTH_AUDIT|ownership_orphans|' || (
  (SELECT COUNT(*) FROM public.organizations o LEFT JOIN public.users u ON u.id = o.admin_id WHERE u.id IS NULL) +
  (SELECT COUNT(*) FROM public.organization_members om LEFT JOIN public.users u ON u.id = om.user_id WHERE u.id IS NULL) +
  (SELECT COUNT(*) FROM public.guests g LEFT JOIN public.users u ON u.id = g.created_by WHERE g.created_by IS NOT NULL AND u.id IS NULL)
);
