# CBE Incubation Hub

Website for College of Business Education (CBE) where students sign in and list their startup ideas. Client: Josh's brother at CBE. Built by Josh (freelance).

## Stack
- React + Vite (browser app, no custom server)
- Supabase: Postgres database, Auth, Row Level Security (RLS)
- Vercel for hosting
- Excel export with a library such as `exceljs`
- Videos: YouTube unlisted links (we store links only)

## Roles
- **student**: sees and edits only their own profile, idea, support, progress updates, lesson progress.
- **mentor**: sees only students in hubs listed in `mentor_hubs`. Can review progress updates, post lessons, download Excel for their hubs only. Cannot move a student to another hub.
- **admin**: sees everything, assigns mentors to hubs, edits dropdown lists, downloads all hubs. Only admin can change roles.

## Key rules
- The browser talks to Supabase directly, so RLS is the real security. Never rely on hiding buttons.
- Schema is in `supabase/schema.sql` (run in the Supabase SQL editor). Do not weaken policies or triggers (`guard_profile`, `guard_idea`, `claim_preregistered`).
- Students already registered with CBE are loaded into the `preregistered` table. When a student confirms their email, a trigger claims their details. Keep "Confirm email" ON in Supabase Auth.
- One startup idea per student. Idea stages: idea, prototype, operational, revenue_generating.
- Progress updates are video links; a mentor approves them, which moves the stage.
- Never put the Supabase service-role key in the frontend. Only the anon key goes in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Excel export
- Plain black and white, bold header row, thin borders, no colours.
- Mentor file: one tab per hub they run, only those students.
- Admin file: tab "All Hubs" with everyone, then one tab per hub.
- Use `hubs.short_name` for tab names (Excel limit is 31 characters).
- Source data: the `students_export` view. Columns follow CBE's own register (No., Full Name, Innovation Hub, Stage, etc.).

## Data facts from CBE
- 22 hubs, 7 departments, 3 campuses, 9 clusters, 12 sectors, 10 support types.
- Report says 343 students; Excel register only has details for 155. Ask CBE for the full list.
- 3 students have invalid emails; do not import them until fixed.
- Private student data: never commit real student files to git.

## Build order
1. Vite project + Supabase client + login/sign-up with email confirmation
2. Student profile and idea form
3. Student progress video updates and lessons
4. Mentor dashboard (hub-scoped), approvals, lesson posting
5. Admin dashboard (all hubs, mentor assignment, lists)
6. Excel downloads
7. Test with a few real students, then deploy to Vercel

## Working style
Josh prefers short, simple, honest answers. Keep UI simple and mobile-friendly.
