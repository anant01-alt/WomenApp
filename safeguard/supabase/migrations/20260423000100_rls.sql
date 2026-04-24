-- =============================================================================
-- SafeGuard — Row Level Security
-- Every table denies by default. Policies grant access per claim.
-- =============================================================================

-- Helper: admin claim check. Admin role lives in auth.users.raw_app_meta_data.role
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_insert_self on profiles;
create policy profiles_insert_self on profiles for insert
  with check (auth.uid() = id);

-- ─── emergency_contacts ──────────────────────────────────────────────────────
alter table emergency_contacts enable row level security;

drop policy if exists emergency_contacts_owner_all on emergency_contacts;
create policy emergency_contacts_owner_all on emergency_contacts for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ─── alerts ──────────────────────────────────────────────────────────────────
alter table alerts enable row level security;

drop policy if exists alerts_select_own on alerts;
create policy alerts_select_own on alerts for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists alerts_insert_own on alerts;
create policy alerts_insert_own on alerts for insert
  with check (auth.uid() = user_id);

drop policy if exists alerts_update_own_or_admin on alerts;
create policy alerts_update_own_or_admin on alerts for update
  using (auth.uid() = user_id or public.is_admin());

-- ─── alert_notifications ─────────────────────────────────────────────────────
alter table alert_notifications enable row level security;

drop policy if exists alert_notifications_select_owner on alert_notifications;
create policy alert_notifications_select_owner on alert_notifications for select
  using (
    exists (
      select 1 from alerts a
      where a.id = alert_notifications.alert_id
        and (a.user_id = auth.uid() or public.is_admin())
    )
  );

-- ─── location_logs ───────────────────────────────────────────────────────────
-- Two branches:
--   (a) owner sees their own logs
--   (b) holders of a valid short-lived tracking JWT see the subject user's logs.
alter table location_logs enable row level security;

drop policy if exists location_logs_select on location_logs;
create policy location_logs_select on location_logs for select
  using (
    auth.uid() = user_id
    or public.is_admin()
    or (
      (auth.jwt() ->> 'track')::boolean is true
      and user_id = (auth.jwt() ->> 'sub')::uuid
    )
  );

drop policy if exists location_logs_insert_own on location_logs;
create policy location_logs_insert_own on location_logs for insert
  with check (auth.uid() = user_id);

-- ─── checkins ────────────────────────────────────────────────────────────────
alter table checkins enable row level security;

drop policy if exists checkins_owner_all on checkins;
create policy checkins_owner_all on checkins for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ─── tracking_links ──────────────────────────────────────────────────────────
-- Public viewers do NOT read tracking_links directly — they go through the
-- SECURITY DEFINER validate_tracking_token() function. Owner manages their own.
alter table tracking_links enable row level security;

drop policy if exists tracking_links_owner_all on tracking_links;
create policy tracking_links_owner_all on tracking_links for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ─── push_subscriptions ──────────────────────────────────────────────────────
alter table push_subscriptions enable row level security;

drop policy if exists push_subscriptions_owner_all on push_subscriptions;
create policy push_subscriptions_owner_all on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── messages ────────────────────────────────────────────────────────────────
alter table messages enable row level security;

drop policy if exists messages_participant_select on messages;
create policy messages_participant_select on messages for select
  using (auth.uid() in (sender_id, receiver_id) or public.is_admin());

drop policy if exists messages_sender_insert on messages;
create policy messages_sender_insert on messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists messages_receiver_mark_read on messages;
create policy messages_receiver_mark_read on messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- ─── sos_rate_limits ─────────────────────────────────────────────────────────
-- Only writable by service role (rate-limiting happens server-side).
alter table sos_rate_limits enable row level security;

drop policy if exists sos_rate_limits_select_own on sos_rate_limits;
create policy sos_rate_limits_select_own on sos_rate_limits for select
  using (auth.uid() = user_id);

-- ─── sent_notifications ──────────────────────────────────────────────────────
-- Service-role only. No user access.
alter table sent_notifications enable row level security;

-- ─── audit_log ───────────────────────────────────────────────────────────────
-- Admin-only read. No user access, no user writes (service role only).
alter table audit_log enable row level security;

drop policy if exists audit_log_admin_read on audit_log;
create policy audit_log_admin_read on audit_log for select
  using (public.is_admin());
