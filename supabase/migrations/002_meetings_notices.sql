-- Run once in the Supabase SQL editor if you ran schema.sql before 2026-11-15 (meetings and notices).
-- schema.sql already has this for fresh projects. Safe to run twice.

-- Online meetings (Google Meet, Zoom, Teams…). We store the link only.
-- For everyone (hub and student both empty: admin only), one hub, or one student.
create table if not exists meetings (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  starts_at  timestamptz not null,
  link       text not null check (link ~* '^https://'),
  note       text,
  hub_id     uuid references hubs(id),
  student_id uuid references profiles(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (hub_id is null or student_id is null)
);

-- Notices from staff. Campus, hub and programme pick who sees it; an empty one means "any".
create table if not exists notices (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  link         text check (link is null or link ~* '^https?://'),
  campus_id    uuid references campuses(id),
  hub_id       uuid references hubs(id),
  programme_id uuid references programmes(id),
  created_by   uuid references profiles(id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now()
);

create index if not exists meetings_starts_at_idx  on meetings (starts_at);
create index if not exists meetings_hub_id_idx     on meetings (hub_id);
create index if not exists meetings_student_id_idx on meetings (student_id);
create index if not exists notices_created_at_idx  on notices (created_at);

-- True when the signed-in mentor looks after this hub.
create or replace function runs_hub(p_hub uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from mentor_hubs where mentor_id = auth.uid() and hub_id = p_hub);
$$;

-- True when the signed-in person matches an audience. An empty choice matches anyone.
create or replace function in_audience(p_campus uuid, p_hub uuid, p_programme uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid()
    and (p_campus    is null or p.campus_id    = p_campus)
    and (p_hub       is null or p.hub_id       = p_hub)
    and (p_programme is null or p.programme_id = p_programme));
$$;

grant select, insert, update, delete on meetings, notices to authenticated;
alter table meetings enable row level security;
alter table notices  enable row level security;

-- meetings: a student sees those for everyone, their hub, or them.
-- A mentor plans them for their own hubs or their own students; an admin for anyone.
drop policy if exists meeting_read   on meetings;
drop policy if exists meeting_insert on meetings;
drop policy if exists meeting_update on meetings;
drop policy if exists meeting_delete on meetings;
create policy meeting_read on meetings for select to authenticated using (
  is_admin() or created_by = auth.uid()
  or (hub_id is null and student_id is null)
  or student_id = auth.uid()
  or (hub_id is not null and (in_audience(null, hub_id, null) or runs_hub(hub_id)))
  or (student_id is not null and is_staff() and can_see_student(student_id)));
create policy meeting_insert on meetings for insert to authenticated with check (
  is_admin()
  or (my_role() = 'mentor' and created_by = auth.uid()
      and ((hub_id is not null and runs_hub(hub_id))
           or (student_id is not null and can_see_student(student_id)))));
create policy meeting_update on meetings for update to authenticated
  using (is_admin() or (my_role() = 'mentor' and created_by = auth.uid()))
  with check (
    is_admin()
    or (my_role() = 'mentor' and created_by = auth.uid()
        and ((hub_id is not null and runs_hub(hub_id))
             or (student_id is not null and can_see_student(student_id)))));
create policy meeting_delete on meetings for delete to authenticated
  using (is_admin() or (my_role() = 'mentor' and created_by = auth.uid()));

-- notices: a student sees those whose campus, hub and programme all match them.
-- A mentor posts only to one of their hubs; an admin to anyone.
drop policy if exists notice_read   on notices;
drop policy if exists notice_insert on notices;
drop policy if exists notice_update on notices;
drop policy if exists notice_delete on notices;
create policy notice_read on notices for select to authenticated using (
  is_admin() or created_by = auth.uid()
  or in_audience(campus_id, hub_id, programme_id)
  or (hub_id is not null and runs_hub(hub_id)));
create policy notice_insert on notices for insert to authenticated with check (
  is_admin()
  or (my_role() = 'mentor' and created_by = auth.uid() and hub_id is not null and runs_hub(hub_id)));
create policy notice_update on notices for update to authenticated
  using (is_admin() or (my_role() = 'mentor' and created_by = auth.uid()))
  with check (
    is_admin()
    or (my_role() = 'mentor' and created_by = auth.uid() and hub_id is not null and runs_hub(hub_id)));
create policy notice_delete on notices for delete to authenticated
  using (is_admin() or (my_role() = 'mentor' and created_by = auth.uid()));
