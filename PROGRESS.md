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
- **16 Nov, from the compasspathways.com reference (only 3 of its animations taken):** new landing section "Every idea needs a hub" after the hero (video in a tall pill, scroll zoom on computers); menu/footer links roll letter by letter on hover; the blue "Ready to start your business?" panel has white dashes that turn flat as you scroll (computers only). Skipped on purpose: the pinned opening, side-sliding headings, mouse parallax, compass ring (the page already has one pinned section; more would lag on phones)
- **16 Nov, images:** all pictures are WebP now and the video is compressed (`public/` 2.6 MB → 409 KB). Full-size originals are in `design-originals/` (not in git). Student Dashboard banner uses `public/dashboard/vision.webp`; the other drawings (idea-bulb, idea-carry, thinking, planning, spark) are ready to use. New pictures: convert to WebP before adding
- **16 Nov, front page rebuilt to the new prompt (Compass layout, CBE words and blue/white):** order is now 1 Opening (pinned on computers: headline rotates, round video drops 51px and zooms 2.06→1 as you scroll; wide student card "Every idea needs a hub." after it), 2 "Beyond the idea" (white, 700px column, pinned: list rises 262px, word "stage" slides in, floating FIG labels), 3 "Opening new doors for your business." (blue, tall, pinned, dash grid turns flat, N E S W tilts -1° on hover), 4 "We all have a why." (white, tall, lines rise in order, mouse parallax on the arrow, dash grid), then How it works, Stages, Hubs, FAQ, closing panel, footer. Removed from the front page: old hero/Reel, "What is the Hub", dark "Questions", "Tiles", "Scattered" (their copy is gone; ask if you want any back). Cookie block from the prompt skipped (no cookies are set). Dead CSS for the removed sections is still in `landing.css` (safe to delete later).
- **16 Nov, fonts on the front page:** Some Time Later is gone from the front page (still used on the sign-in panel). Headings: Plus Jakarta Sans bold. Hero line "Turn your … into a business.": Aptos (Office font; falls back to Calibri)
- **Colours kept blue and white** on purpose (Josh's 15 Nov decision). The prompt's green and red were not used. Say if you want them.
- **16 Nov, default profile pictures:** 7 drawings (3 female, 4 male) in `public/avatars/` (320 px WebP, 5–9 KB each; originals in `design-originals/avatars/`). Order shown: uploaded photo → picked drawing → first drawing for their gender → initials. Students pick one on Profile (under "Upload photo", only while they have no photo); mentors/admins at the top of `/staff/profile`. Needs **migration 006** (below). Not checked signed-in yet

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
- **Run `supabase/migrations/006_default_avatars.sql`** in the same SQL editor (after 005). Until then the drawings still show by gender, but picking one says "not switched on yet"
- **Run `supabase/migrations/005_profile_photos.sql` in the Supabase SQL editor** (profile photos: column, private "photos" bucket, rules). Until then photo upload fails; the rest of the app still works.
- Profile page (16 Nov): form in cards, student card + photo upload + completeness ring on the right
- New on 16 Nov, Pitch.io layout (not checked signed-in yet): white sidebar with "Post an update" button and tab joining the page, top bar with date and your name, student Dashboard with banner, 4 tiles and rows. Picture for the banner: save it as `public/dashboard/student.png`
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
