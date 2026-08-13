-- These rows were created by Clerk before Better Auth owned authentication.
-- They have no Better Auth account yet, but Clerk already established ownership
-- of their unique email addresses. Mark only that imported cohort as verified so
-- the first Google sign-in can link to the existing user instead of duplicating it.
UPDATE public.users AS users
SET email_verified = true
WHERE email_verified = false
  AND NOT EXISTS (
    SELECT 1
    FROM public.accounts AS accounts
    WHERE accounts.user_id = users.id
  );
