-- =============================================================================
-- SafeGuard — Demo seed (run in Supabase SQL editor AFTER migrations)
-- Creates a demo resolved alert + some trusted contacts for the first user.
-- =============================================================================

-- Pick any existing user to seed data for. If no users exist yet, this is a no-op.
with target as (
  select id from auth.users order by created_at asc limit 1
)
insert into emergency_contacts (user_id, name, phone, email, relationship, is_primary)
select t.id, v.name, v.phone, v.email, v.relationship::relationship_type, v.is_primary
  from target t,
       (values
         ('Asha Sharma',  '+911234567801', 'asha@example.com',  'mother',   true),
         ('Rohan Mehta',  '+911234567802', 'rohan@example.com', 'brother',  false),
         ('Priya Patel',  '+911234567803', 'priya@example.com', 'friend',   false)
       ) as v(name, phone, email, relationship, is_primary)
  where not exists (select 1 from emergency_contacts where user_id = t.id)
     on conflict do nothing;

-- A resolved demo alert
with target as (
  select id from auth.users order by created_at asc limit 1
)
insert into alerts (user_id, type, status, triggered_by, message, location_lat, location_lng, location_address, resolved_at)
select t.id, 'sos', 'resolved', 'manual',
       'Demo alert — resolved within 3 minutes.',
       28.6139, 77.2090, 'Connaught Place, New Delhi',
       now() - interval '1 day'
  from target t
 where not exists (select 1 from alerts where user_id = t.id)
    on conflict do nothing;
