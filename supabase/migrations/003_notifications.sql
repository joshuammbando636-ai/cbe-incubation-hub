-- Run once in the Supabase SQL editor if you ran schema.sql before 2026-11-15 (notifications).
-- schema.sql already has this for fresh projects. Safe to run twice.

-- Messages for one person, shown at the top of the site until they dismiss them.
-- Only the database writes them (the triggers below); a person can read and dismiss their own.
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on notifications (user_id);

grant select, delete on notifications to authenticated;
alter table notifications enable row level security;
drop policy if exists notification_read    on notifications;
drop policy if exists notification_dismiss on notifications;
create policy notification_read    on notifications for select to authenticated using (user_id = auth.uid());
create policy notification_dismiss on notifications for delete to authenticated using (user_id = auth.uid());

-- When an admin changes someone's role, tell that person.
create or replace function notify_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    insert into notifications (user_id, title, body) values (new.id,
      case new.role when 'admin'  then 'You are now an admin'
                    when 'mentor' then 'You are now a mentor'
                    else 'You are now a student' end,
      case new.role when 'admin'  then 'You can see every hub, give people roles and edit the lists.'
                    when 'mentor' then 'An admin will choose the hubs you look after. Their students will then appear under Students.'
                    else 'Your mentor or admin access has been removed.' end);
  end if;
  return new;
end $$;

drop trigger if exists notify_role_change on profiles;
create trigger notify_role_change after update of role on profiles
for each row execute function notify_role_change();

-- When an admin gives a mentor a hub, tell the mentor.
create or replace function notify_hub_added() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, title, body)
  select new.mentor_id, 'New hub: ' || h.name,
         'You now look after ' || h.name || '. Its students are under Students.'
  from hubs h where h.id = new.hub_id;
  return new;
end $$;

drop trigger if exists notify_hub_added on mentor_hubs;
create trigger notify_hub_added after insert on mentor_hubs
for each row execute function notify_hub_added();
