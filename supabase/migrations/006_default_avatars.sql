-- Run once in the Supabase SQL editor (16 Nov 2026): default profile pictures.
-- schema.sql already has this for fresh projects. Safe to run twice.

-- A drawn picture a person picks until they add a photo. The pictures are
-- files in the website (public/avatars/female-1.webp …), so only the name is kept.
alter table profiles add column if not exists avatar text;
alter table profiles drop constraint if exists profile_avatar_known;
alter table profiles add constraint profile_avatar_known
  check (avatar is null or avatar ~ '^(female|male)-[1-9]$');
