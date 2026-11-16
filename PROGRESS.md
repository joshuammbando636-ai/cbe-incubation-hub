# Where we are (last updated 16 Nov 2026, evening)

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
- **16 Nov (late), front page in the Compass style, CBE words, app blue:** `src/pages/Landing.jsx` + `src/pages/landing.css`. Dark pill nav at the top centre (CBE, Sign in, Join, menu button; menu opens a dark panel inside the pill, Esc closes). Hero: your video fills the screen with "Every idea / needs a / hub."; as you scroll it eases into one rounded rectangle and only "hub." stays; no play button, no Scroll label (3 screens tall, sticky, scroll-linked). Then a big sentence with small icons whose words light up as you scroll, "Turn your [word] into a business." with the buttons, the 4 stage cards (icons, no numbers), the blue sign-up panel, a dark navy footer (logo, links, call button +255 627 375 912, no line above). Hub list removed from the front page. All big lines use Aptos. Video: `public/landing/hub-hero.mp4` (753 KB, from the full-size original). Send a landscape video for sharper desktop
- **16 Nov, two colours on the front page (Josh chose):** deep navy #0b1a33 (same as the dashboard headings) and off-white #f8f8f6. Softer text and lines are the navy at lower strength; no other colours. Changing the navy is one line in src/pages/landing.css (--h-ink)
- **16 Nov, action links are buttons now:** standalone links (Forgot your password?, Create an account, Back to sign in, Add your idea, Post a progress video, Open your profile, Open notices, Join meeting, Open link, Watch video, All students) are rounded pills (`a.link-btn` in `src/index.css`; `--quiet` outline, `--small`, `--back` ←, `--out` ↗). Links inside sentences and tables stay plain
- **16 Nov, direct messages (needs migration 007, see To do):** Messages page for students (`/student/messages`, "Chat" in the phone bar) and staff (`/staff/messages`). Who can write to whom, both ways, enforced by the database: a student and the mentors of their hub; an admin and anyone. Students and students, or a mentor and a student outside their hubs, cannot. Mentors/admins can tag a message Support, Instruction or Correction. Unread count on the Messages menu item; a "Message" button on a student's page. New messages appear within about 8 seconds (checked while the page is open), not instantly
- **16 Nov, staff greeting:** Overview says "Good morning/afternoon/evening, Mr./Ms. Surname." with "Administrator" or "Mentor" above it (full name if no gender is set)
- **16 Nov, sign-up page** now uses the same two-panel layout as sign-in (blue panel left, form right)
- **16 Nov, images:** all pictures are WebP now and the video is compressed (`public/` 2.6 MB → 409 KB). Full-size originals are in `design-originals/` (not in git). Student Dashboard banner uses `public/dashboard/vision.webp` (Josh's background-free version, transparent, 25 KB); the other drawings (idea-bulb, idea-carry, thinking, planning, spark) are ready to use. New pictures: convert to WebP before adding
- **16 Nov, default profile pictures:** 7 drawings (3 female, 4 male) in `public/avatars/` (320 px WebP, 5–9 KB each; originals in `design-originals/avatars/`). Order shown: uploaded photo → picked drawing → first drawing for their gender → initials. Students pick one on Profile (under "Upload photo", only while they have no photo); mentors/admins at the top of `/staff/profile`. Needs **migration 006** (below). Not checked signed-in yet
- **16 Nov (pitch day), front page rebuilt in the butter.video style** (Josh asked; Lorem capture in `D:\Lorem\Inspections\butter.video 2026-11-16 0854`). Words, colours and pictures are CBE's own; butter's 3D keychain pictures are NOT used (they belong to butter). **Replaces the video hero and the dark centred pill** (the video file is kept but no longer on the front page). Header: a grey pill on the left (CBE logo, About · How it works · Stages · Inside, ⋮) that shrinks to logo + ⋮ when you scroll; ⋮ opens a dropdown that unrolls with rounded corners (Esc closes); a second pill on the right with Sign in + dark Join. Phones: logo + ⋮ and Sign in + Join. Hero: light grey to off-white, open space at the top with one cut-out drawing (`HERO_IMAGE` in `Landing.jsx` = `/dashboard/idea-bulb-cut.webp`; set it to `null` for empty space), then "Every idea needs a hub." big and centred (its letters sharpen out of a blur on load; the words drift apart at different speeds as you scroll away; no hanging charms, Josh found them too AI-looking), "The College of Business Education's home for student businesses." and Get started. Below, in order: smooth scrolling (Lenis, computers only) · **two rows of the 22 hub names** that slide as you scroll · "Turn your [word] into a business." · **How it works** in the brancon.vercel.app row style (Josh, 16 Nov): a centred heading whose second line fills in as you scroll, then 4 rows with thin lines between them, each a circled number, the background-removed drawing, one short line and a huge word on the right (Join, Describe, Share, Grow) whose letters flow up one by one with the scroll. Rows 3 and 4 use the two "JSON" drawings (planning, vision): keep them (`*-cut.webp` + `vision.webp` in `public/dashboard/`, PNG originals in `design-originals/`) · **The stages**: an open timeline, no panel or tiles; on computers a playhead runs along a ruler as you scroll, lights up Idea → Prototype → Operational → Earning and underlines the current one; phones get a plain list · **Inside the hub**: heading + a big typed list of the student's tools (Idea, Progress, Lessons, Mentor, Meetings, Messages) with thin lines between rows; hover a row (computer with a mouse) and a 3-second silent clip pops up in a rounded frame that follows the pointer, with the tool's name on it. Clips: `public/landing/tools/<name>.mp4` + `.webp` still (about 500 KB for all six), cut from Josh's two Klickpin videos now kept in `design-originals/` (green "grow" promo for Idea, Progress, Mentor, Meetings, Messages; the reading-woman cartoon for Lessons); replace a file to change what a row shows · **Ready to start your business?** with no card: words and buttons beside a cut-out drawing (`idea-carry-cut.webp`, caption removed) · footer like butter.video's: the page above ends in rounded bottom corners over a grey footer; columns with small labels (Explore, Your account, Questions) and big links; a giant "Incubation Hub" in Some Time Later (Josh's logo font) across the bottom edge, rising as you reach it. The "Incubation Hub" name in the nav and footer logo also uses Some Time Later. Section headings come out of a blur word by word (phones: no blur). Nav links: a white pill pops up on hover. Fine grain over the whole page (`.home::after` in `landing.css`; change `opacity: 0.07` to make it stronger or weaker). One easing curve everywhere (`--ease` in `src/pages/landing.css`). Hub names on the front page are a fixed list in `Landing.jsx` (`HUBS`): if a hub is renamed in Lists, change it there too. No cards anywhere on the front page (Josh, 16 Nov). The two "JSON, Lottie" pictures in `design-originals/` are only previews: the moving Lottie `.json` files are not on the computer; download them from that set into `public/lottie/` if we want them animated. Checked at 1440 px and on a 375 px phone. Dashboards and sign-in pages are unchanged

- **See it on your phone (same Wi-Fi as the computer):** in PowerShell `cd "C:\CBE Incubation Hub"` then `npm run dev -- --host --port 5175`, and open the "Network" address it prints on your phone (16 Nov it was http://192.168.1.197:5175). If the phone can't open it, Windows Firewall is blocking Node: allow it on private networks when Windows asks.

## To do (in this order)

### NEXT: Show CBE the new front page (rebuilt 16 Nov 2026, evening)
CBE turned down the old design. Josh sent a new layout (davidecarusio.it spec + Lorem capture `D:\Lorem\Inspections\davidecarusio.it 2026-11-16 2125` + his FlowGradient shader) and the **front page was rebuilt** to it: loader, moving cream gradient hero with the giant "Incubation Hub", dark bars, three statements over a dot grid, How it works rows (mouse-over: a blue panel wipes up behind the drawing and an arrow slides in; no videos), the four stages list, questions, footer. **Blue and white** (Josh, 16 Nov): white #F7F9FD, navy words, deep blue #0A2463 dark sections, bright blue #1D4ED8 tags/hovers; the hero gradient is blue and white and follows the cursor. Geist fonts. Words: content.md → "Front page (v3)". Checked at 1440 px and on a 375 px phone; 123 tests, lint and build pass.
- **16 Nov (late):** navbar pills now white like the page; hero words rise in on arrival; big name in Funnel Display fades up and its words drift apart on scroll; questions rows get a hover band + slide; How it works pictures half the size; campus names removed from the front page.
- **Kept as Josh asked:** his two-pill navbar (unchanged; only the 4th link now says FAQ) and the sign-in / sign-up pages (untouched).
- **Not done yet:** dashboards still have the old navy look. Ask Josh whether they should follow the new front page.
- The loader plays once per browser session. To see it again, open the site in a new private window.
- Not committed yet.

### 0. After the pitch: dashboard in the front-page style (Josh decided 16 Nov)
The dashboard already uses navy + off-white in the code. Still to do: match the front page's feel on the signed-in pages (grey pills, Some Time Later headings, words that come out of a blur, grain, the one easing curve). Keep the cards on the dashboard: they group numbers and lists. Not on pitch day.

### 0a. You: run migration 007 (messages)
Open https://supabase.com/dashboard/project/qyuleunnfckmudkilcul/sql/new, paste all of `supabase/migrations/007_messages.sql`, click Run. Until then the Messages page says "Messages are not switched on yet".

### 0b. Later: notifications bell
Josh's idea: the bell in the top bar should lead somewhere useful (Notices / new messages). Not built yet.

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
- Migrations **005 (profile photos) and 006 (default pictures) are run** (Josh, 16 Nov)
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

- `npm test` (122 tests), `npm run lint`, `npm run build`
- Real speed: `npm run build` then `npm run preview` (dev mode is slower)
