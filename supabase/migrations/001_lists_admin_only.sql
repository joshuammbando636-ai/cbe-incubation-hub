-- Run once in the Supabase SQL editor if you ran schema.sql before 2026-11-15.
-- Only an admin may change the dropdown lists (before, any mentor could).
-- schema.sql already has this for fresh projects.
do $$
declare t text;
begin
  foreach t in array array['campuses','departments','programmes','study_levels',
                           'clusters','hubs','sectors','support_types'] loop
    execute format('drop policy if exists %I on %I', t || '_write', t);
    execute format('create policy %I on %I for all to authenticated using (is_admin()) with check (is_admin())', t || '_write', t);
  end loop;
end $$;
