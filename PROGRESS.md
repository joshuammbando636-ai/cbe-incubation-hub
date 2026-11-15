# Where we are (last updated 15 Nov 2026)

Read this first when you come back. Then tell Claude: "read PROGRESS.md and let's continue".

## Done and working

- Login, sign-up with email confirmation, password reset
- Student: profile, idea, progress videos, lessons, Notices page (meetings + notices)
- Mentor/admin: Overview (By stage, By hub, By campus), Students list (filters: campus, hub, programme, stage, to confirm), one-student page (summary at the top), Reviews, Lessons, Meetings, Notices
- Admin: People (roles, mentor hubs), Lists (dropdowns)
- Excel download on the Students page (mentor: their hubs; admin: All Hubs + one tab per hub)
- Speed: remembers who is signed in, pages show instantly when you go back to them
- Accessibility: skip link, focus moves to new pages, red borders on bad fields, contrast checked
- Database: `schema.sql`, plus migrations `001` and `002` run in Supabase
- Live at https://cbe-incubation-hub.vercel.app (code on GitHub: joshuammbando636-ai/cbe-incubation-hub)
- Supabase URL Configuration points at the live site; emails go out through Gmail SMTP (cbeincubationhub@gmail.com), rate limit 100/hour
- joshuammbando636@gmail.com is admin
- Password boxes have a Show/Hide button
- Admin menu: "Students" is called **People** for admins, with two tabs: Students / Mentors and admins. The old People page is gone (`/admin/people` redirects). Open a person → **Role** section (admin only) → for a mentor, hubs as chips (× removes) plus a search box to add one; each change saves at once
- New accounts are always students; only an admin changes roles
- Notifications: a person sees "You are now a mentor/admin/student", "New hub: …" and "Removed from hub: …" at the top of the site until they press OK (migrations `003`, `004`)
- Type-to-search dropdowns (programme, hub, sector, Students filters)
- Student profile asks Programme + Hub only: department fills in from the programme, cluster from the hub. Hub → cluster links are a **first guess**, editable under Lists → Hubs
- Sign-up and profile insist on a real first and last name (letters only, no nicknames)
- Mentor hub-scoping checked by Josh on the live site with real accounts: mentors see only their hubs' students
- **New look (15 Nov evening):** blue and white everywhere; a landing page at `/` for visitors (hero, numbers, how it works, stages, who it is for, live hub list, about, call to action) with GSAP animations; signed-in pages have a left sidebar with icons (slide-out menu on phones), user name + role + Sign out at the bottom
- Dashboards restyled: white cards on light blue (`src/dashboard.css`), status pills; Overview has a welcome banner, stat cards with icons and stage bars; student Home has a blue banner with hub, mentor and a 4-stage track, then task cards; sign-in page has no footer
- Josh will send fonts, a prompt and reference images for a second design pass

## To do (in this order)

### 0. You: run migrations 003 and 004 in Supabase, then deploy
1. Open https://supabase.com/dashboard/project/qyuleunnfckmudkilcul/sql/new, paste all of `supabase/migrations/003_notifications.sql`, click Run. Then the same with `004_hub_clusters.sql` (003 first).
2. Deploy: in PowerShell `cd "C:\CBE Incubation Hub"` then `vercel --prod`. Or connect Git once at https://vercel.com/joshuammbando636-5988s-projects/cbe-incubation-hub/settings/git so every push deploys.

3. Ask your brother to check Lists → Hubs → "Which cluster each hub is in".

See it locally any time: `npm run dev`, then open http://localhost:5173 (signed out = landing page).

### 1. Claude: email copies of notices, meetings and role changes
Plan: a small Supabase function that emails the students a notice or meeting is for, and emails a person when they become a mentor or admin.

### 2. You: check registration numbers
Look at CBE's register. If every number looks like `03.12345.01.01.2026`, tell Claude to make the check strict.

### 3. You: test on your phone (built 15 Nov, not checked yet)
- Overview: By stage and By campus tables (click a row, it filters Students)
- Students: Campus and Programme filters, "Video waiting" mark
- One student: summary at the top (stage, profile, videos waiting, lessons)
- Mentor: plan a meeting and post a notice; a student in that hub sees it, a student in another hub does not
- Computer: press Tab on any page, "Skip to content" appears
- New on 16 Nov (not checked signed-in yet): bottom bar on phones (Home, Idea, Progress, Lessons, More), Profile moved down next to Sign out, blue "Next step" card on student Home
- New on 16 Nov (not checked signed-in yet): sidebar minimize button on computers (top of the sidebar, shrinks to icons, remembered per browser); Profile page for mentors/admins (`/staff/profile`: name, gender, phone, change password); Change password also on the student Profile page

### 4. Emails landing in Spam
Gmail SMTP works but some emails go to Spam. Proper fix before real students: a domain (ask CBE for one like `hub.cbe.ac.tz`, or buy one), then send through Brevo or Resend with that domain.

### 5. Test with a few real students

### 6. Ask CBE for the full student list
The report says 343 students; the register only has details for 155. 3 emails are invalid, so don't import those until fixed.

## Decisions already made (no need to ask again)

- **Supabase region: do not move.** All regions measured 211–247 ms from here; moving gains almost nothing.
- **"Course" = programme.**
- **Notices are in the app only for now.** Email comes in step 1.
- **Meetings use outside links** (Google Meet, Zoom, Teams). We don't build video calls.
- **The CBE details claim stays as it is.** It only runs when someone confirms their email, so it stays safe even if "Confirm email" is ever switched off.

## Checks

- `npm test` (105 tests), `npm run lint`, `npm run build`
- Real speed: `npm run build` then `npm run preview` (dev mode is slower)
