-- =============================================================================
-- SafeGuard — Functions and triggers
-- =============================================================================

-- ─── Generic updated_at stamp ────────────────────────────────────────────────
create or replace function public.update_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles
  for each row execute function public.update_updated_at();

drop trigger if exists checkins_updated_at on checkins;
create trigger checkins_updated_at before update on checkins
  for each row execute function public.update_updated_at();

drop trigger if exists push_subscriptions_updated_at on push_subscriptions;
create trigger push_subscriptions_updated_at before update on push_subscriptions
  for each row execute function public.update_updated_at();

-- ─── Auto-create profile row on auth.users insert ────────────────────────────
create or replace function public.on_auth_user_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.on_auth_user_created();

-- ─── Enforce max 5 emergency contacts per user ───────────────────────────────
create or replace function public.enforce_max_5_contacts() returns trigger
language plpgsql as $$
declare cnt int;
begin
  select count(*) into cnt from emergency_contacts where user_id = new.user_id;
  if cnt >= 5 then
    raise exception 'A user may have at most 5 emergency contacts.'
      using errcode = '23505';
  end if;
  return new;
end $$;

drop trigger if exists emergency_contacts_max5 on emergency_contacts;
create trigger emergency_contacts_max5 before insert on emergency_contacts
  for each row execute function public.enforce_max_5_contacts();

-- ─── Keep location geometry + lat/lng in sync ────────────────────────────────
create or replace function public.sync_location_geometry() returns trigger
language plpgsql as $$
begin
  if new.location_lat is not null and new.location_lng is not null then
    new.location := st_setsrid(st_makepoint(new.location_lng, new.location_lat), 4326)::geography;
  end if;
  return new;
end $$;

drop trigger if exists alerts_sync_location on alerts;
create trigger alerts_sync_location before insert or update on alerts
  for each row execute function public.sync_location_geometry();

drop trigger if exists location_logs_sync_location on location_logs;
create trigger location_logs_sync_location before insert or update on location_logs
  for each row execute function public.sync_location_geometry();

-- ─── validate_tracking_token (SECURITY DEFINER) ──────────────────────────────
-- Public viewers call this via POST /api/track/[token] to exchange token+passcode
-- for the subject user_id. Handles lockout after 5 failed attempts.
-- NOTE: fully qualify column references that collide with OUT params (expires_at),
-- and call crypt() from the extensions schema (Supabase places pgcrypto there).
create or replace function public.validate_tracking_token(
  p_token text,
  p_passcode text
) returns table(user_id uuid, alert_id uuid, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_link tracking_links;
begin
  select * into v_link from tracking_links
    where tracking_links.token = p_token
      and tracking_links.revoked_at is null
      and tracking_links.expires_at > now()
    for update;

  if not found then
    return;
  end if;

  if v_link.locked_until is not null and v_link.locked_until > now() then
    return;
  end if;

  if v_link.passcode_hash is not null then
    if p_passcode is null
       or extensions.crypt(p_passcode, v_link.passcode_hash) <> v_link.passcode_hash then
      update tracking_links
        set failed_attempts = tracking_links.failed_attempts + 1,
            locked_until = case when tracking_links.failed_attempts + 1 >= 5
                                then now() + interval '15 minutes'
                                else tracking_links.locked_until end
      where tracking_links.id = v_link.id;
      return;
    end if;
  end if;

  update tracking_links
    set view_count = tracking_links.view_count + 1,
        failed_attempts = 0,
        locked_until = null
  where tracking_links.id = v_link.id;

  user_id := v_link.user_id;
  alert_id := v_link.alert_id;
  expires_at := v_link.expires_at;
  return next;
end $$;

-- ─── sweep_overdue_checkins (SECURITY DEFINER, called from cron) ─────────────
-- Two-stage: first overdue pass sends a nudge, second pass (after grace) triggers.
-- FOR UPDATE SKIP LOCKED guarantees no double-processing on cron retry.
create or replace function public.sweep_overdue_checkins()
returns table(action text, checkin_id uuid, user_id uuid, alert_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  rec record;
  v_alert_id uuid;
begin
  -- Stage 1: nudge (inside grace window, never nudged)
  for rec in
    select id, checkins.user_id
      from checkins
      where status = 'active'
        and next_check_at < now()
        and (now() - next_check_at) < (grace_period_minutes || ' minutes')::interval
        and (last_nudged_at is null or last_nudged_at < next_check_at)
      for update skip locked
  loop
    update checkins set last_nudged_at = now() where id = rec.id;
    action := 'nudge';
    checkin_id := rec.id;
    user_id := rec.user_id;
    alert_id := null;
    return next;
  end loop;

  -- Stage 2: trigger (past grace window)
  for rec in
    select c.id, c.user_id, c.message_template
      from checkins c
      where c.status = 'active'
        and (now() - c.next_check_at) >= (c.grace_period_minutes || ' minutes')::interval
      for update skip locked
  loop
    insert into alerts (user_id, type, status, triggered_by, message)
      values (rec.user_id, 'checkin', 'active', 'checkin_timeout',
              coalesce(rec.message_template, 'Safety check-in missed — auto SOS triggered.'))
      returning id into v_alert_id;

    update checkins set status = 'triggered', updated_at = now() where id = rec.id;

    action := 'trigger';
    checkin_id := rec.id;
    user_id := rec.user_id;
    alert_id := v_alert_id;
    return next;
  end loop;
end $$;

-- ─── SOS rate limit helper ───────────────────────────────────────────────────
-- Returns true if user is within their hourly SOS budget (5/hour).
create or replace function public.consume_sos_rate_limit(p_user_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_row sos_rate_limits;
begin
  insert into sos_rate_limits (user_id, window_start, trigger_count_1h)
    values (p_user_id, now(), 0)
    on conflict (user_id) do nothing;

  select * into v_row from sos_rate_limits where user_id = p_user_id for update;

  if now() - v_row.window_start > interval '1 hour' then
    update sos_rate_limits
      set window_start = now(), trigger_count_1h = 1
      where user_id = p_user_id;
    return true;
  end if;

  if v_row.trigger_count_1h >= 5 then
    return false;
  end if;

  update sos_rate_limits
    set trigger_count_1h = trigger_count_1h + 1
    where user_id = p_user_id;
  return true;
end $$;

-- ─── Passcode hashing (bcrypt via pgcrypto) ──────────────────────────────────
create or replace function public.hash_passcode(p_passcode text)
returns text
language sql security definer set search_path = public as $$
  select crypt(p_passcode, gen_salt('bf', 10));
$$;

-- ─── Look up user_ids by email (service-role only) ──────────────────────────
-- Used by push fan-out to find which contacts are also SafeGuard users.
create or replace function public.get_user_ids_by_emails(p_emails text[])
returns table(id uuid, email text)
language sql security definer set search_path = public as $$
  select u.id, u.email
    from auth.users u
   where u.email = any(p_emails);
$$;

revoke all on function public.get_user_ids_by_emails(text[]) from public;

-- ─── Grants so service role can call the SECURITY DEFINER functions ──────────
grant execute on function public.validate_tracking_token(text, text) to anon, authenticated, service_role;
grant execute on function public.sweep_overdue_checkins() to service_role;
grant execute on function public.consume_sos_rate_limit(uuid) to authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.get_user_ids_by_emails(text[]) to service_role;
grant execute on function public.hash_passcode(text) to authenticated, service_role;
