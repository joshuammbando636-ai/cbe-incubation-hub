-- Run once in the Supabase SQL editor (16 Nov 2026): direct messages.
-- schema.sql already has this for fresh projects. Safe to run twice.

-- One-to-one messages. Who may write to whom (both ways):
--   a student and a mentor of the student's hub; an admin and anyone.
-- You read only messages you sent or received. Nobody edits or deletes them;
-- only mark_messages_read() changes them (it sets read_at on yours).
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  kind         text not null default 'general'
               check (kind in ('general', 'support', 'instruction', 'correction')),
  body         text not null check (length(btrim(body)) between 1 and 4000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  check (sender_id <> recipient_id)
);
create index if not exists messages_pair_idx on messages (sender_id, recipient_id, created_at);
create index if not exists messages_unread_idx on messages (recipient_id, read_at);

-- True when these two people may write to each other.
create or replace function can_message(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_a <> p_b and exists (
    select 1 from profiles a, profiles b
    where a.id = p_a and b.id = p_b
      and (a.role = 'admin' or b.role = 'admin'
        or (a.role = 'mentor' and b.role = 'student'
            and exists (select 1 from mentor_hubs mh where mh.mentor_id = a.id and mh.hub_id = b.hub_id))
        or (a.role = 'student' and b.role = 'mentor'
            and exists (select 1 from mentor_hubs mh where mh.mentor_id = b.id and mh.hub_id = a.hub_id))));
$$;

-- The database stamps the time and starts every message unread.
create or replace function stamp_message() returns trigger
language plpgsql as $$
begin
  new.created_at := now();
  new.read_at := null;
  new.body := btrim(new.body);
  return new;
end $$;

drop trigger if exists stamp_message on messages;
create trigger stamp_message before insert on messages
for each row execute function stamp_message();

revoke all on messages from anon;
revoke update, delete on messages from authenticated;
grant select, insert on messages to authenticated;
alter table messages enable row level security;

drop policy if exists message_read on messages;
drop policy if exists message_send on messages;
create policy message_read on messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
-- Only staff tag a message (support, instruction, correction); students send plain ones.
create policy message_send on messages for insert to authenticated
  with check (sender_id = auth.uid()
              and can_message(auth.uid(), recipient_id)
              and (kind = 'general' or is_staff()));

-- Mark everything this person sent you as read.
create or replace function mark_messages_read(p_other uuid) returns void
language sql security definer set search_path = public as $$
  update messages set read_at = now()
  where recipient_id = auth.uid() and sender_id = p_other and read_at is null;
$$;

-- People you may write to: for a student, the mentors of their hub and the admins;
-- for a mentor, their hubs' students and the admins; for an admin, everyone.
create or replace function message_contacts()
returns table (id uuid, full_name text, role user_role, gender gender_type, avatar text, photo_path text, hub text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.role, p.gender, p.avatar, p.photo_path, h.name
  from profiles p
  left join hubs h on h.id = p.hub_id
  where can_message(auth.uid(), p.id)
  order by p.role desc, p.full_name;
$$;

-- Your conversations, newest first: the other person, the last message, and how many are unread.
create or replace function my_conversations()
returns table (other_id uuid, full_name text, role user_role, gender gender_type, avatar text, photo_path text,
               last_body text, last_kind text, last_at timestamptz, last_from_me boolean, unread int)
language sql stable security definer set search_path = public as $$
  with mine as (
    select m.*, case when m.sender_id = auth.uid() then m.recipient_id else m.sender_id end as other
    from messages m
    where auth.uid() in (m.sender_id, m.recipient_id)
  ), last as (
    select distinct on (other) other, body, kind, created_at, sender_id = auth.uid() as from_me
    from mine
    order by other, created_at desc
  )
  select p.id, p.full_name, p.role, p.gender, p.avatar, p.photo_path,
         l.body, l.kind, l.created_at, l.from_me,
         (select count(*)::int from mine u where u.other = l.other and u.recipient_id = auth.uid() and u.read_at is null)
  from last l
  join profiles p on p.id = l.other
  order by l.created_at desc;
$$;
