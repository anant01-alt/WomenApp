-- =============================================================================
-- SafeGuard — Initial schema
-- Extensions, enums, tables, indexes, realtime publications.
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists postgis;
create extension if not exists pgcrypto;
create extension if not exists citext;

-- ─── Enums ────────────────────────────────────────────────────────────────────
-- Postgres enum values with hyphens require quoting everywhere. Use underscores.
do $$ begin
  create type safety_status as enum ('safe','alert','emergency');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_type as enum ('sos','warning','checkin','fake_call');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_status as enum ('active','resolved','cancelled','false_alarm');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_trigger as enum ('manual','shake','checkin_timeout','fake_call');
exception when duplicate_object then null; end $$;

do $$ begin
  create type checkin_status as enum ('active','completed','triggered','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type relationship_type as enum ('mother','father','sister','brother','spouse','friend','colleague','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('push','email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('queued','sent','failed');
exception when duplicate_object then null; end $$;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Admin role lives in auth.users.raw_app_meta_data.role (NOT here) to prevent
-- privilege escalation via profile edits.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text check (phone is null or phone ~ '^\+[1-9]\d{7,14}$'),
  avatar_url text,
  address text,
  timezone text not null default 'UTC',
  safety_status safety_status not null default 'safe',
  last_location geography(Point, 4326),
  last_location_lat double precision,
  last_location_lng double precision,
  last_location_at timestamptz,
  age_confirmed_18 bool not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── emergency_contacts ──────────────────────────────────────────────────────
-- Max 5 per user enforced via BEFORE INSERT trigger (see functions migration).
-- Unique primary contact enforced via partial unique index.
create table if not exists emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text check (phone is null or phone ~ '^\+[1-9]\d{7,14}$'),
  email citext,
  relationship relationship_type not null,
  is_primary bool not null default false,
  notification_prefs jsonb not null default '{"push":true,"email":true}'::jsonb,
  created_at timestamptz not null default now(),
  constraint emergency_contacts_contact_info_check
    check (phone is not null or email is not null)
);
create unique index if not exists emergency_contacts_one_primary
  on emergency_contacts(user_id) where is_primary;
create index if not exists emergency_contacts_user_id
  on emergency_contacts(user_id);

-- ─── alerts ──────────────────────────────────────────────────────────────────
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type alert_type not null,
  status alert_status not null default 'active',
  triggered_by alert_trigger not null default 'manual',
  message text,
  location geography(Point, 4326),
  location_lat double precision,
  location_lng double precision,
  location_address text,
  audio_url text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists alerts_user_created on alerts(user_id, created_at desc);
create index if not exists alerts_active_partial on alerts(status) where status = 'active';
create index if not exists alerts_location_gix on alerts using gist(location);

-- ─── alert_notifications (per-contact delivery log) ──────────────────────────
create table if not exists alert_notifications (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references alerts(id) on delete cascade,
  contact_id uuid not null references emergency_contacts(id) on delete cascade,
  channel notification_channel not null,
  status notification_status not null default 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists alert_notifications_alert on alert_notifications(alert_id);
create index if not exists alert_notifications_contact on alert_notifications(contact_id);

-- ─── location_logs ───────────────────────────────────────────────────────────
-- Duplicate lat/lng as plain numerics for Realtime serialization safety.
-- 30-day retention via a weekly prune cron (see app/api/cron/retention-sweep).
create table if not exists location_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_id uuid references alerts(id) on delete cascade,
  location geography(Point, 4326) not null,
  location_lat double precision not null,
  location_lng double precision not null,
  accuracy real,
  is_emergency bool not null default false,
  recorded_at timestamptz not null default now()
);
create index if not exists location_logs_alert_time on location_logs(alert_id, recorded_at);
create index if not exists location_logs_user_time on location_logs(user_id, recorded_at desc);

-- ─── checkins ────────────────────────────────────────────────────────────────
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interval_minutes int not null check (interval_minutes between 5 and 720),
  grace_period_minutes int not null default 2 check (grace_period_minutes between 0 and 60),
  next_check_at timestamptz not null,
  status checkin_status not null default 'active',
  message_template text,
  last_nudged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists checkins_due on checkins(next_check_at) where status = 'active';

-- ─── tracking_links (public share-live-location) ─────────────────────────────
create table if not exists tracking_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_id uuid references alerts(id) on delete cascade,
  token text unique not null check (length(token) >= 32),
  passcode_hash text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  view_count int not null default 0,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tracking_links_user on tracking_links(user_id);

-- ─── push_subscriptions ──────────────────────────────────────────────────────
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on push_subscriptions(user_id);

-- ─── messages (chat ported from MERN) ────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  conversation_key text not null,
  content text not null check (length(content) between 1 and 4000),
  alert_id uuid references alerts(id),
  is_read bool not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_time on messages(conversation_key, created_at desc);

-- ─── sos_rate_limits (sliding window) ────────────────────────────────────────
create table if not exists sos_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  trigger_count_1h int not null default 0
);

-- ─── sent_notifications (idempotency key store for cron) ─────────────────────
create table if not exists sent_notifications (
  key text primary key,
  created_at timestamptz not null default now()
);

-- ─── audit_log ───────────────────────────────────────────────────────────────
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_actor_time on audit_log(actor_id, created_at desc);

-- ─── Realtime publications ──────────────────────────────────────────────────
-- Required so client-side supabase.channel().on('postgres_changes', ...) works.
-- Wrap in DO so re-runs don't error on already-added tables.
do $$
declare t text;
begin
  foreach t in array array['alerts','location_logs','messages','alert_notifications']
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
