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

## To do (in this order)

### 1. You: set up email in Supabase (no code)
Fixes "Too many emails sent".
1. Make a Gmail for the hub. Turn on 2-Step Verification. Google Account → Security → **App passwords** → create one.
2. Supabase → Authentication → Emails → **SMTP Settings** → enable custom SMTP:
   - Host `smtp.gmail.com`, port `465`
   - Username: the Gmail address
   - Password: the app password
   - Sender name: `CBE Incubation Hub`
3. Supabase → Authentication → **Rate Limits** → emails per hour: about 100.

For testing before that: Authentication → Users → **Add user**, tick **Auto Confirm User** (no email sent; these accounts do not pick up CBE's pre-registered details).

### 2. Claude: email copies of notices and meetings
Needs step 1 first. Plan: a small Supabase function that emails the students a notice or meeting is for.

### 3. You: check registration numbers
Look at CBE's register. If every number looks like `03.12345.01.01.2026`, tell Claude to make the check strict.

### 4. You: test on your phone (built 15 Nov, not checked yet)
- Overview: By stage and By campus tables (click a row, it filters Students)
- Students: Campus and Programme filters, "Video waiting" mark
- One student: summary at the top (stage, profile, videos waiting, lessons)
- Mentor: plan a meeting and post a notice; a student in that hub sees it, a student in another hub does not
- Computer: press Tab on any page, "Skip to content" appears

### 5. Deploy to Vercel
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel. Then add the live address to Supabase → Authentication → URL Configuration (Site URL and Redirect URLs).

### 6. Test with a few real students

### 7. Ask CBE for the full student list
The report says 343 students; the register only has details for 155. 3 emails are invalid, so don't import those until fixed.

## Decisions already made (no need to ask again)

- **Supabase region: do not move.** All regions measured 211–247 ms from here; moving gains almost nothing.
- **"Course" = programme.**
- **Notices are in the app only for now.** Email comes in step 2.
- **Meetings use outside links** (Google Meet, Zoom, Teams). We don't build video calls.
- **The CBE details claim stays as it is.** It only runs when someone confirms their email, so it stays safe even if "Confirm email" is ever switched off.

## Checks

- `npm test` (86 tests), `npm run lint`, `npm run build`
- Real speed: `npm run build` then `npm run preview` (dev mode is slower)
