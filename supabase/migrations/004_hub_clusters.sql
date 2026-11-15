-- Run once in the Supabase SQL editor if you ran schema.sql before 2026-11-16 (hub clusters).
-- schema.sql already has this for fresh projects. Safe to run twice.

-- Each hub sits in one cluster, so students no longer pick the cluster themselves.
-- The links below are a FIRST GUESS: check them under Lists → Hubs and fix any that are wrong.
alter table hubs add column if not exists cluster_id uuid references clusters(id) on delete set null;

update hubs h set cluster_id = c.id
from (values
  ('E-Commerce & Digital Marketing Hub', 'Business & Entrepreneurship'),
  ('Startup Ideation & Development Hub', 'Business & Entrepreneurship'),
  ('Business Scale-Up Hub', 'Business & Entrepreneurship'),
  ('HR Tech Hub', 'Business & Entrepreneurship'),
  ('Operations & Productivity Hub', 'Business & Entrepreneurship'),
  ('Tourism & Hospitality Tech Hub', 'Business & Entrepreneurship'),
  ('Event Tech Hub', 'Business & Entrepreneurship'),
  ('Cybersecurity & Risk Hub', 'ICT, AI & Emerging Technologies'),
  ('Artificial Intelligence Hub', 'ICT, AI & Emerging Technologies'),
  ('Software Development Hub', 'ICT, AI & Emerging Technologies'),
  ('Data Science & Analytics Hub', 'ICT, AI & Emerging Technologies'),
  ('Smart Logistics Hub', 'Logistics & Supply Chain'),
  ('E-Procurement Hub', 'Logistics & Supply Chain'),
  ('Agribusiness Innovation Hub', 'Agribusiness & Green Economy'),
  ('E-Government Innovation Hub', 'Public Sector & Smart Governance'),
  ('Digital Records & Archives Hub', 'Public Sector & Smart Governance'),
  ('Accounting Tech Hub', 'FinTech & Business Analytics'),
  ('Business Analytics Hub', 'FinTech & Business Analytics'),
  ('FinTech Innovation Hub', 'FinTech & Business Analytics'),
  ('Tax & RegTech Hub', 'FinTech & Business Analytics'),
  ('Digital Metrology, AI and Quality Infrastructure Innovation Hub', 'Metrology, Standards & Quality Infrastructure'),
  ('Advanced Measurement, Automation and Smart Systems Innovation Hub', 'Metrology, Standards & Quality Infrastructure')
) as v(hub, cluster)
join clusters c on c.name = v.cluster
where h.name = v.hub and h.cluster_id is null;

-- Fill in what follows from other answers:
--   department = the programme's department (a programme sits in one department)
--   cluster    = the hub's cluster, when the hub changes (unless the same save sets a cluster, as the CBE claim does)
create or replace function fill_profile_links() returns trigger
language plpgsql security definer set search_path = public as $$
declare hub_cluster uuid;
begin
  if new.programme_id is not null then
    select department_id into new.department_id from programmes where id = new.programme_id;
  end if;
  if new.hub_id is not null and (tg_op = 'INSERT' or (new.hub_id is distinct from old.hub_id
                                  and new.cluster_id is not distinct from old.cluster_id)) then
    select cluster_id into hub_cluster from hubs where id = new.hub_id;
    new.cluster_id := coalesce(hub_cluster, new.cluster_id);
  end if;
  return new;
end $$;

drop trigger if exists fill_profile_links on profiles;
create trigger fill_profile_links before insert or update on profiles
for each row execute function fill_profile_links();

-- People who already chose a hub but no cluster.
update profiles p set cluster_id = h.cluster_id
from hubs h where h.id = p.hub_id and p.cluster_id is null and h.cluster_id is not null;

-- When an admin takes a hub away from a mentor, tell the mentor
-- (not when the whole account is being deleted).
create or replace function notify_hub_removed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, title, body)
  select old.mentor_id, 'Removed from hub: ' || h.name,
         'You no longer look after ' || h.name || '. Its students no longer appear under Students.'
  from hubs h
  where h.id = old.hub_id and exists (select 1 from profiles where id = old.mentor_id);
  return old;
end $$;

drop trigger if exists notify_hub_removed on mentor_hubs;
create trigger notify_hub_removed after delete on mentor_hubs
for each row execute function notify_hub_removed();
