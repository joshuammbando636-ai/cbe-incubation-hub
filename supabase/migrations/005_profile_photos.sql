-- Run once in the Supabase SQL editor (16 Nov 2026): profile photos.
-- schema.sql already has this for fresh projects. Safe to run twice.

-- A formal photo per person, kept in the private "photos" bucket at <user id>/<file>.
-- You upload, replace and delete only your own. You see a photo only when you can
-- see that person's profile (same rule as profile_read).

alter table profiles add column if not exists photo_path text;
alter table profiles drop constraint if exists profile_photo_own_folder;
alter table profiles add constraint profile_photo_own_folder
  check (photo_path is null or split_part(photo_path, '/', 1) = id::text);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- True when the signed-in person may see the photo stored at this path.
create or replace function can_see_photo(p_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  begin
    v_owner := split_part(p_name, '/', 1)::uuid;
  exception when others then
    return false;
  end;
  return exists (select 1 from profiles where id = v_owner and (role <> 'student' or can_see_student(id)));
end $$;

drop policy if exists photo_read on storage.objects;
create policy photo_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and can_see_photo(name));

drop policy if exists photo_insert on storage.objects;
create policy photo_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists photo_update on storage.objects;
create policy photo_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'photos' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists photo_delete on storage.objects;
create policy photo_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and split_part(name, '/', 1) = auth.uid()::text);
