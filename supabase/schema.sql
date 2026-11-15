-- CBE Incubation Hub: database schema v3 (Supabase / Postgres)
-- Built from CBE's November 2026 register (Excel) and summary report (PDF).
-- Paste into the SQL editor of a FRESH Supabase project and run once.

-- =====================================================================
-- 1. FIXED CHOICES
-- =====================================================================
create type user_role     as enum ('student', 'mentor', 'admin');
create type gender_type   as enum ('male', 'female');
create type idea_stage    as enum ('idea', 'prototype', 'operational', 'revenue_generating');
create type review_status as enum ('pending', 'verified', 'rejected');

-- =====================================================================
-- 2. DROPDOWN LISTS  (the options a student picks from; staff can edit them)
-- =====================================================================
create table campuses      (id uuid primary key default gen_random_uuid(), name text not null unique);
create table departments   (id uuid primary key default gen_random_uuid(), name text not null unique, code text not null unique);
create table study_levels  (id uuid primary key default gen_random_uuid(), name text not null unique, position int not null);
create table clusters      (id uuid primary key default gen_random_uuid(), name text not null unique);
create table hubs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  short_name text not null unique check (char_length(short_name) <= 31)   -- used as the Excel tab name
);
create table sectors       (id uuid primary key default gen_random_uuid(), name text not null unique);
create table support_types (id uuid primary key default gen_random_uuid(), name text not null unique);

-- A programme always sits inside one department.
create table programmes (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id),
  name          text not null,
  unique (department_id, name),
  unique (id, department_id)
);

-- =====================================================================
-- 3. MAIN TABLES
-- =====================================================================

-- One row per person with an account (student, mentor or admin).
-- Created automatically at sign-up; the student then fills in the rest.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'student',
  full_name     text not null,
  email         text not null,
  reg_number    text unique,                         -- no two accounts with one reg. number
  gender        gender_type,
  phone         text,
  campus_id     uuid references campuses(id),
  department_id uuid references departments(id),
  programme_id  uuid,
  level_id      uuid references study_levels(id),
  grad_year     int check (grad_year between 2000 and 2100),
  cluster_id    uuid references clusters(id),
  hub_id        uuid references hubs(id),            -- the ONE innovation hub they chose
  needs_review  boolean not null default false,      -- staff tick this: "details to confirm"
  review_note   text,
  created_at    timestamptz not null default now(),
  -- the programme must belong to the chosen department
  foreign key (programme_id, department_id) references programmes (id, department_id)
);

-- The student's business idea. One per student. Optional: many students have none yet.
create table startup_ideas (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null unique references profiles(id) on delete cascade,
  description   text not null,                       -- "Business Idea / Project"
  business_name text,
  sector_id     uuid references sectors(id),
  owns_business boolean not null default false,
  stage         idea_stage not null default 'idea',  -- student states it once; after that only a mentor moves it
  mentor_id     uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Which kinds of support each student asked for (they can tick several).
create table student_support (
  student_id      uuid references profiles(id) on delete cascade,
  support_type_id uuid references support_types(id) on delete cascade,
  primary key (student_id, support_type_id)
);

-- Progress tracking: student posts a video link as proof, a mentor verifies it,
-- and the idea moves to that stage.
create table progress_updates (
  id          uuid primary key default gen_random_uuid(),
  idea_id     uuid not null references startup_ideas(id) on delete cascade,
  stage       idea_stage not null,                   -- the stage this video proves
  note        text,
  video_url   text not null,
  status      review_status not null default 'pending',
  reviewed_by uuid references profiles(id) on delete set null,
  feedback    text,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Video lessons posted by mentors. hub_id empty = lesson is for every student.
create table lessons (
  id           uuid primary key default gen_random_uuid(),
  hub_id       uuid references hubs(id) on delete set null,
  title        text not null,
  description  text,
  video_url    text not null,                        -- YouTube (unlisted) link
  position     int  not null default 0,
  is_published boolean not null default false,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Which student finished which lesson.
create table lesson_progress (
  lesson_id    uuid references lessons(id) on delete cascade,
  student_id   uuid references profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);

-- Which hubs each mentor looks after. A mentor sees only the students in these hubs.
-- An admin does not need rows here: an admin sees every hub.
create table mentor_hubs (
  mentor_id uuid references profiles(id) on delete cascade,
  hub_id    uuid references hubs(id) on delete cascade,
  primary key (mentor_id, hub_id)
);

-- The students already registered with CBE (loaded once by the admin from CBE's Excel).
-- They have no account yet. When one signs up and confirms the SAME email, their details
-- are copied into their profile automatically (trigger 4e below) and this row is marked claimed.
create table preregistered (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique check (email = lower(email)),
  full_name        text not null,
  reg_number       text unique,
  gender           gender_type,
  phone            text,
  campus_id        uuid references campuses(id),
  department_id    uuid references departments(id),
  programme_id     uuid,
  level_id         uuid references study_levels(id),
  grad_year        int check (grad_year between 2000 and 2100),
  cluster_id       uuid references clusters(id),
  hub_id           uuid references hubs(id),
  idea_description text,
  business_name    text,
  sector_id        uuid references sectors(id),
  owns_business    boolean,
  stage            idea_stage,
  support          text[],                       -- names of the support types ticked
  needs_review     boolean not null default false,
  review_note      text,
  claimed_by       uuid references profiles(id) on delete set null,
  claimed_at       timestamptz,
  foreign key (programme_id, department_id) references programmes (id, department_id)
);

-- Online meetings (Google Meet, Zoom, Teams…). We store the link only.
-- For everyone (hub and student both empty: admin only), one hub, or one student.
create table meetings (
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
create table notices (
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

create index on profiles (hub_id);
create index on profiles (department_id);
create index on startup_ideas (mentor_id);
create index on progress_updates (idea_id);
create index on lessons (hub_id);
create index on meetings (starts_at);
create index on meetings (hub_id);
create index on meetings (student_id);
create index on notices (created_at);

-- =====================================================================
-- 4. HELPERS AND AUTOMATION
-- =====================================================================
create function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create function is_staff() returns boolean
language sql stable as $$
  select coalesce(my_role() in ('mentor', 'admin'), false);
$$;

create function is_admin() returns boolean
language sql stable as $$
  select coalesce(my_role() = 'admin', false);
$$;

-- True when the signed-in person may see this student:
-- themselves, any student (admin), or a student in one of their hubs (mentor).
create function can_see_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_student = auth.uid()
      or is_admin()
      or (my_role() = 'mentor' and exists (
            select 1 from profiles s
            join mentor_hubs mh on mh.hub_id = s.hub_id
            where s.id = p_student and mh.mentor_id = auth.uid()));
$$;

create function can_see_idea(p_idea uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from startup_ideas i where i.id = p_idea and can_see_student(i.owner_id));
$$;

-- True when the signed-in mentor looks after this hub.
create function runs_hub(p_hub uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from mentor_hubs where mentor_id = auth.uid() and hub_id = p_hub);
$$;

-- True when the signed-in person matches an audience. An empty choice matches anyone.
create function in_audience(p_campus uuid, p_hub uuid, p_programme uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid()
    and (p_campus    is null or p.campus_id    = p_campus)
    and (p_hub       is null or p.hub_id       = p_hub)
    and (p_programme is null or p.programme_id = p_programme));
$$;

-- 4a. Sign-up creates the profile row. Everyone starts as a student.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- 4e. When a person confirms their email, and CBE already registered that email,
--     copy CBE's details into their profile. Keep "Confirm email" switched ON in Supabase,
--     otherwise anyone could claim someone else's record by typing their email.
create function claim_preregistered() returns trigger
language plpgsql security definer set search_path = public as $$
declare r preregistered%rowtype;
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    select * into r from preregistered where email = lower(new.email) and claimed_by is null;
    if found then
      update profiles set
        full_name = r.full_name, reg_number = r.reg_number, gender = r.gender, phone = r.phone,
        campus_id = r.campus_id, department_id = r.department_id, programme_id = r.programme_id,
        level_id = r.level_id, grad_year = r.grad_year, cluster_id = r.cluster_id, hub_id = r.hub_id,
        needs_review = r.needs_review, review_note = r.review_note
      where id = new.id;
      if r.idea_description is not null then
        insert into startup_ideas (owner_id, description, business_name, sector_id, owns_business, stage)
        values (new.id, r.idea_description, r.business_name, r.sector_id,
                coalesce(r.owns_business, false), coalesce(r.stage, 'idea'));
      end if;
      insert into student_support (student_id, support_type_id)
        select new.id, t.id from support_types t where t.name = any (coalesce(r.support, '{}'));
      update preregistered set claimed_by = new.id, claimed_at = now() where id = r.id;
    end if;
  end if;
  return new;
end $$;

create trigger on_auth_user_confirmed
after update of email_confirmed_at on auth.users
for each row execute function claim_preregistered();

-- 4b. Students cannot promote themselves or clear their own review flag.
--     A mentor cannot move a student between hubs (only an admin, or the student, can).
--     (auth.uid() is empty inside the SQL editor, so you can still set the first admin there.)
create function guard_profile() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and current_user = 'authenticated' then
    if new.role is distinct from old.role and coalesce(my_role() <> 'admin', true) then
      raise exception 'Only an admin can change roles';
    end if;
    if new.hub_id is distinct from old.hub_id and my_role() = 'mentor' and old.id <> auth.uid() then
      raise exception 'Only an admin can move a student to another hub';
    end if;
    if not is_staff()
       and (new.needs_review, new.review_note, new.email)
           is distinct from (old.needs_review, old.review_note, old.email) then
      raise exception 'Only staff can change the review flag or the email';
    end if;
  end if;
  return new;
end $$;

create trigger guard_profile before update on profiles
for each row execute function guard_profile();

-- 4c. Students can edit their idea, but not its stage or mentor.
create function guard_idea() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and current_user = 'authenticated' and not is_staff()
     and (new.stage, new.mentor_id, new.owner_id)
         is distinct from (old.stage, old.mentor_id, old.owner_id) then
    raise exception 'Only a mentor can change the stage or the mentor';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger guard_idea before update on startup_ideas
for each row execute function guard_idea();

-- 4d. When a mentor reviews a progress update: stamp who and when,
--     and if it is verified, move the idea to that stage.
create function review_progress_update() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now();
    new.reviewed_by := coalesce(auth.uid(), new.reviewed_by);
    if new.status = 'verified' then
      update startup_ideas set stage = new.stage where id = new.idea_id;
    end if;
  end if;
  return new;
end $$;

create trigger review_progress_update before update on progress_updates
for each row execute function review_progress_update();

-- =====================================================================
-- 5. EXPORT VIEW  (one flat row per student, same columns as CBE's Excel register)
-- =====================================================================
create view students_export with (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.reg_number,
  initcap(p.gender::text)                     as gender,
  ca.name                                     as campus,
  d.name                                      as department,
  d.code                                      as department_code,
  pr.name                                     as programme,
  sl.name                                     as level_of_study,
  p.grad_year,
  p.phone,
  p.email,
  cl.name                                     as cluster,
  h.name                                      as hub,
  h.short_name                                as hub_short,
  i.description                               as business_idea,
  s.name                                      as business_sector,
  i.business_name,
  case when i.id is null then null
       when i.owns_business then 'Yes' else 'No' end as owns_business,
  case i.stage
    when 'idea'               then 'Idea Stage'
    when 'prototype'          then 'Prototype Stage'
    when 'operational'        then 'Operational'
    when 'revenue_generating' then 'Revenue Generating'
  end                                         as business_stage,
  (select string_agg(t.name, '; ' order by t.name)
     from student_support ss
     join support_types t on t.id = ss.support_type_id
    where ss.student_id = p.id)               as support_requested,
  m.full_name                                 as mentor,
  p.needs_review,
  p.review_note,
  p.created_at                                as registered_at
from profiles p
left join campuses ca     on ca.id = p.campus_id
left join departments d   on d.id  = p.department_id
left join programmes pr   on pr.id = p.programme_id
left join study_levels sl on sl.id = p.level_id
left join clusters cl     on cl.id = p.cluster_id
left join hubs h          on h.id  = p.hub_id
left join startup_ideas i on i.owner_id = p.id
left join sectors s       on s.id  = i.sector_id
left join profiles m      on m.id  = i.mentor_id
where p.role = 'student';

-- =====================================================================
-- 6. ACCESS RULES (Row Level Security)
--    A Vite app talks to the database straight from the browser,
--    so these rules ARE the security. Do not remove them.
-- =====================================================================
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Dropdown lists: anyone can read (the sign-up form needs them), only an admin can change (CLAUDE.md).
do $$
declare t text;
begin
  foreach t in array array['campuses','departments','programmes','study_levels',
                           'clusters','hubs','sectors','support_types'] loop
    execute format('alter table %I enable row level security', t);
    execute format('grant select on %I to anon', t);
    execute format('create policy %I on %I for select to anon, authenticated using (true)', t || '_read', t);
    execute format('create policy %I on %I for all to authenticated using (is_admin()) with check (is_admin())', t || '_write', t);
  end loop;
end $$;

alter table profiles         enable row level security;
alter table startup_ideas    enable row level security;
alter table student_support  enable row level security;
alter table progress_updates enable row level security;
alter table lessons          enable row level security;
alter table lesson_progress  enable row level security;
alter table mentor_hubs      enable row level security;
alter table preregistered    enable row level security;
alter table meetings         enable row level security;
alter table notices          enable row level security;

-- Who sees which student:
--   student = only themselves
--   mentor  = only students in the hubs assigned to them (mentor_hubs)
--   admin   = everyone
-- The export view follows the same rules, so a mentor's download holds only their hubs.

-- profiles (staff names are visible to everyone so students can see their mentor)
create policy profile_read on profiles for select to authenticated
  using (role <> 'student' or can_see_student(id));
create policy profile_update on profiles for update to authenticated
  using (can_see_student(id))
  with check (can_see_student(id));

-- startup ideas
create policy idea_read on startup_ideas for select to authenticated
  using (can_see_student(owner_id));
create policy idea_insert on startup_ideas for insert to authenticated
  with check (owner_id = auth.uid() and mentor_id is null);
create policy idea_update on startup_ideas for update to authenticated
  using (can_see_student(owner_id))
  with check (can_see_student(owner_id));
create policy idea_delete on startup_ideas for delete to authenticated
  using (is_admin());

-- support requested
create policy support_read on student_support for select to authenticated
  using (can_see_student(student_id));
create policy support_insert on student_support for insert to authenticated
  with check (can_see_student(student_id));
create policy support_delete on student_support for delete to authenticated
  using (can_see_student(student_id));

-- progress updates: the idea owner submits; a mentor of that hub (or an admin) reviews
create policy progress_read on progress_updates for select to authenticated
  using (can_see_idea(idea_id));
create policy progress_insert on progress_updates for insert to authenticated
  with check (status = 'pending' and reviewed_by is null
              and exists (select 1 from startup_ideas i where i.id = idea_id and i.owner_id = auth.uid()));
create policy progress_review on progress_updates for update to authenticated
  using (is_staff() and can_see_idea(idea_id))
  with check (is_staff() and can_see_idea(idea_id));

-- which hubs a mentor looks after: the mentor reads their own, only an admin changes them
create policy mh_read  on mentor_hubs for select to authenticated using (mentor_id = auth.uid() or is_admin());
create policy mh_write on mentor_hubs for all    to authenticated using (is_admin()) with check (is_admin());

-- the list of students CBE already registered: admin only
create policy prereg_admin on preregistered for all to authenticated using (is_admin()) with check (is_admin());

-- lessons: students see published ones, staff manage
create policy lesson_read  on lessons for select to authenticated using (is_published or is_staff());
create policy lesson_write on lessons for all    to authenticated using (is_staff()) with check (is_staff());

-- lesson progress: your own ticks; staff can read all
create policy lp_read   on lesson_progress for select to authenticated using (can_see_student(student_id));
create policy lp_insert on lesson_progress for insert to authenticated with check (student_id = auth.uid());
create policy lp_delete on lesson_progress for delete to authenticated using (student_id = auth.uid());

-- meetings: a student sees those for everyone, their hub, or them.
-- A mentor plans them for their own hubs or their own students; an admin for anyone.
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

-- =====================================================================
-- 7. STARTING DATA for the dropdown lists (taken from CBE's two documents)
-- =====================================================================
insert into campuses (name) values
  ('Dar es Salaam'), ('Mwanza'), ('Dodoma');

insert into departments (name, code) values
  ('Business Administration', 'BA'),
  ('Accountancy', 'ACC'),
  ('Procurement and Supply', 'PS'),
  ('Marketing', 'MKT'),
  ('Information and Communication Technology', 'ICT'),
  ('Legal and Industrial Metrology', 'LIM'),
  ('Education', 'EDU');

-- Only the programmes that appear in the register. CBE has more: add the rest.
insert into programmes (department_id, name)
select d.id, v.name
from (values
  ('BA',  'Business Administration'),
  ('BA',  'Business Administration in Human Resource Management'),
  ('BA',  'Business Administration in Records and Archives Management'),
  ('BA',  'Entrepreneurship and Innovation'),
  ('ACC', 'Accountancy'),
  ('ACC', 'Accounting and Finance'),
  ('ACC', 'Accounting and Taxation'),
  ('ACC', 'Banking and Finance Management'),
  ('ACC', 'Economics and Finance'),
  ('PS',  'Procurement and Supplies Management'),
  ('PS',  'Transport and Logistics Management'),
  ('MKT', 'Marketing'),
  ('MKT', 'Marketing in Tourism and Event Management'),
  ('ICT', 'Information Technology'),
  ('LIM', 'Metrology and Standardization')
) as v(code, name)
join departments d on d.code = v.code;

insert into study_levels (name, position) values
  ('Basic Technician Certificate (NTA 4)', 1),
  ('Technician Certificate (NTA 5)', 2),
  ('Ordinary Diploma (NTA 6)', 3),
  ('Bachelor''s Degree', 4),
  ('Postgraduate Diploma', 5),
  ('Master''s Degree', 6);

insert into clusters (name) values
  ('Business & Entrepreneurship'),
  ('ICT, AI & Emerging Technologies'),
  ('Logistics & Supply Chain'),
  ('Agribusiness & Green Economy'),
  ('Education & Training'),
  ('Public Sector & Smart Governance'),
  ('FinTech & Business Analytics'),
  ('Metrology, Standards & Quality Infrastructure'),
  ('Other');

insert into hubs (name, short_name) values
  ('E-Commerce & Digital Marketing Hub', 'E-Commerce & Digital Marketing'),
  ('Startup Ideation & Development Hub', 'Startup Ideation & Development'),
  ('Cybersecurity & Risk Hub', 'Cybersecurity & Risk Hub'),
  ('Smart Logistics Hub', 'Smart Logistics Hub'),
  ('Accounting Tech Hub', 'Accounting Tech Hub'),
  ('Artificial Intelligence Hub', 'Artificial Intelligence Hub'),
  ('Business Analytics Hub', 'Business Analytics Hub'),
  ('Agribusiness Innovation Hub', 'Agribusiness Innovation Hub'),
  ('Business Scale-Up Hub', 'Business Scale-Up Hub'),
  ('Software Development Hub', 'Software Development Hub'),
  ('Tourism & Hospitality Tech Hub', 'Tourism & Hospitality Tech Hub'),
  ('Tax & RegTech Hub', 'Tax & RegTech Hub'),
  ('FinTech Innovation Hub', 'FinTech Innovation Hub'),
  ('E-Procurement Hub', 'E-Procurement Hub'),
  ('Digital Metrology, AI and Quality Infrastructure Innovation Hub', 'Digital Metrology & Quality Hub'),
  ('Data Science & Analytics Hub', 'Data Science & Analytics Hub'),
  ('E-Government Innovation Hub', 'E-Government Innovation Hub'),
  ('Digital Records & Archives Hub', 'Digital Records & Archives Hub'),
  ('HR Tech Hub', 'HR Tech Hub'),
  ('Operations & Productivity Hub', 'Operations & Productivity Hub'),
  ('Event Tech Hub', 'Event Tech Hub'),
  ('Advanced Measurement, Automation and Smart Systems Innovation Hub', 'Adv. Measurement & Automation');

insert into sectors (name) values
  ('Fashion, Beauty and Accessories'),
  ('Food, Beverages and Catering'),
  ('ICT, Software and Digital Platforms'),
  ('Agribusiness and Agro-processing'),
  ('Trading and Retail'),
  ('Creative Arts, Design and Digital Marketing'),
  ('Finance, Accounting and FinTech'),
  ('Manufacturing and Product Innovation'),
  ('Transport and Logistics'),
  ('Education, Training and Social Impact'),
  ('Tourism and Hospitality'),
  ('Other Services');

insert into support_types (name) values
  ('Business Mentorship'),
  ('Technical Mentorship'),
  ('Startup Development'),
  ('Funding Opportunities'),
  ('Product Development'),
  ('Digital Marketing'),
  ('Networking'),
  ('Intellectual Property Support'),
  ('Research Commercialization'),
  ('Standards and Regulatory Guidance');

-- =====================================================================
-- AFTER RUNNING
-- 1. Sign up with your own account in the app.
-- 2. Make yourself admin (run here, once):
--      update profiles set role = 'admin' where email = 'you@example.com';
-- 3. Promote mentors the same way, or from the admin screen.
-- 4. Give each mentor their hubs (a mentor with no hubs sees no students):
--      insert into mentor_hubs select p.id, h.id from profiles p, hubs h
--      where p.email = 'mentor@example.com' and h.short_name = 'Smart Logistics Hub';
-- =====================================================================
