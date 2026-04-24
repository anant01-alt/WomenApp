-- =============================================================================
-- SafeGuard — Bootstrap first admin
-- Replace the email below with your admin account's email, then run.
-- Admin privileges live in auth.users.raw_app_meta_data.role so they cannot
-- be escalated through RLS-covered profile updates.
-- =============================================================================

-- NOTE: Run this AFTER you've signed up at least once with the email below.
-- If the user does not exist yet, the UPDATE will affect 0 rows and do nothing.

update auth.users
   set raw_app_meta_data =
       coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
 where email = 'anantkesarwani01@gmail.com';  -- ← change to your admin email
