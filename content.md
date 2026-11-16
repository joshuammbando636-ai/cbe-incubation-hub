# CBE Incubation Hub: content

Every screen, in order, with the real words. Build from this file. Do not invent other wording.

Voice: plain English, short sentences, "you". Many students read this on a small phone with costly data, so every screen says one thing and asks for one action.

## Design decisions

Made once. Do not change them mid-build.

- **Two colours across the whole site** (Josh, 16 Nov 2026; replaces the bright blue + gradient): deep navy #0b1a33 and off-white #f8f8f6, the same as the front page. Greys, lines and soft backgrounds are navy mixed into the off-white, never a third colour. One exception Josh wants kept: the sign-in / sign-up left panel uses the original blue gradient over the office photo (`hub-hero.webp`). Amber and red only for waiting/error status.
- Two signals besides the accent: amber for "waiting / to confirm", red for errors and "not accepted". Both appear as a small dot or a thin left rule, never as a filled block.
- Visitors who are signed out land on a **landing page** at `/` (hero, numbers, how it works, stages, who it is for, hubs, about, call to action). Signed-in pages follow Josh's Pitch.io reference (16 Nov 2026): a white **left sidebar** (logo, one big action button, menu, help card, Sign out; the current tab joins the page beside it), a top bar with the page name, date, notices bell and your name (opens Profile), and on student Dashboard a soft-blue welcome banner, four blue overview tiles and one row per area. The sidebar has icons (on phones: a bottom bar for the main pages, and "More" opens the full menu as a drawer).
- **Front page rebuilt 16 Nov 2026** (CBE turned the old one down): davidecarusio.it layout and motion with CBE's words, blue and white, Geist / Geist Mono. See "Front page (v3)" at the end of this file. The header stays Josh's two-pill navbar (butter.video layout), unchanged. Sign-in, sign-up and the dashboards keep the navy + off-white look below until Josh says otherwise.
- Two typefaces (16 Nov 2026, Josh's butter.video reference): **Inter Tight** for all text and headings across the site (self-hosted from npm `@fontsource-variable/inter-tight`): tight letters, big lines weight 500 with negative tracking (hero: huge headline, medium line, normal button). **Some Time Later** (SIL Open Font Licence, 34 KB in `src/assets/fonts`) only for the logo and the big line on the sign-in / sign-up picture.
- Type scale with big jumps: 14 / 16 / 20 / 32 / 56 / 96 px. Headings are large, tight and left-aligned.
- Everything hangs left. Nothing is centred except the loading spinner.
- Thin 1px rules and borders, no shadows. One radius everywhere: 8px.
- Spacing on a 4/8px scale, with generous space between sections.
- One signature moment: the huge serif headline on the sign-in screen. Everything else stays quiet.
- Motion comes last and stays small: CSS only, opacity and transform only, switched off when the device asks for reduced motion.
- Touch targets are at least 44px. Every screen works at 360, 768 and 1280px wide, with no sideways scrolling.
- Light theme only.
- Every page starts with a "Skip to content" link that appears when a keyboard user presses Tab. Opening a new page scrolls to the top and moves focus to the page.

## Words used everywhere

- App name: **CBE Incubation Hub**
- Footer: College of Business Education · Incubation Hub
- Browser tab title: `{Page title} · CBE Incubation Hub`

**Business stages** (CBE's own wording, same as the Excel register)

| Value | Label | One-line meaning |
|---|---|---|
| idea | Idea Stage | You have an idea but nothing is built yet. |
| prototype | Prototype Stage | You have a sample, a test version or a first trial. |
| operational | Operational | The business is running and serving customers. |
| revenue_generating | Revenue Generating | The business earns money regularly. |

**Video status**

| Value | Label |
|---|---|
| pending | Waiting for review |
| verified | Verified |
| rejected | Not accepted |

**Roles**: Student, Mentor, Admin. **Gender**: Male, Female.

**Dates** are written like `14 Nov 2026`.

**Empty choice in every dropdown**: Choose…

**Messages**

| When | Message |
|---|---|
| A required text field is empty | Enter your {field}. |
| A required dropdown is empty | Choose your {field}. |
| Email is malformed | Enter a valid email address, like name@example.com. |
| Password too short | Use at least 8 characters. |
| Passwords differ | The two passwords do not match. |
| Registration number is malformed | Use the format on your student ID, like 03.12345.01.01.2026. |
| Phone is malformed | Enter a phone number, like 0712 345 678. |
| Graduation year is malformed | Enter a year, like 2027. |
| Link is not a YouTube link | Paste a YouTube link, like https://youtu.be/abc123. |
| A saved link that is not a web address | This link cannot be opened. |
| A saved link that is not on YouTube | Watch video (opens in a new tab) |
| No internet | No connection. Check your internet and try again. |
| Registration number already taken | This registration number is already used by another account. Check it, or ask your mentor for help. |
| Programme is not in the department | That programme does not belong to the department you chose. |
| A list name already exists | That name is already on the list. |
| Deleting a choice that is in use | This is in use, so it cannot be deleted. |
| The database refuses the action | You are not allowed to do that. |
| Anything else | Something went wrong. Please try again. |
| Loading | Loading… |
| Saving | Saving… |

---

## Signed-out screens

### Sign in (`/login`)

Left side (top on a phone):

- Wordmark: CBE Incubation Hub
- Headline (the one huge line): **Turn your idea into a business.**
- Line under it: Register your idea, join an innovation hub and get a mentor at the College of Business Education.
- Three steps, small: 1. Create your account · 2. Tell us your idea · 3. Show your progress

Right side (below on a phone), a form titled **Sign in**:

- Email
- Password
- Button: **Sign in**
- Link: Forgot your password?
- Line: New here? **Create an account**

Messages:

- Wrong details: Wrong email or password.
- Email not confirmed yet: Confirm your email first. We sent you a link when you signed up. Button: Send the link again
- After resending: Sent. Check your inbox.

### Create account (`/signup`)

- Title: **Create your account**
- Line: It takes one minute. You fill in your details after you confirm your email.
- Full name. Hint: Your real first and last name, as on your CBE registration. Mentors use it to find you.
  Error: Enter your real first and last name, as on your CBE registration. Letters only, no nicknames.
- Email. Hint: Already registered with CBE's incubation programme? Use the same email and we will fill in your details for you.
- Password. Hint: At least 8 characters.
- Confirm password
- Button: **Create account**
- Line: Already have an account? **Sign in**

Messages:

- Email already has an account: This email already has an account. Sign in, or reset your password.
- Too many emails sent: Too many emails sent. Wait a few minutes and try again.

### Check your email (`/check-email`)

- Title: **Check your email**
- Body: We sent a link to **{email}**. Open it to confirm your address. The link signs you in.
- Small line: Nothing after a few minutes? Look in your spam folder, or send it again.
- Button: Send the link again
- After resending: Sent. Check your inbox.
- Link: Back to sign in

### Email link landing (`/auth/callback`)

- While working: Confirming your email…
- If the link fails, title: **That link did not work**
- Body: It may have expired or been used already. Ask for a new one below.
- Email, then button: Send a new link
- Link: Back to sign in

### Forgot password (`/forgot-password`)

- Title: **Forgot your password?**
- Body: Enter your email and we will send you a link to choose a new one.
- Email
- Button: **Send reset link**
- After sending: If {email} has an account, a reset link is on its way.
- Link: Back to sign in

### New password (`/reset-password`)

- Title: **Choose a new password**
- New password. Hint: At least 8 characters.
- Confirm new password
- Button: **Save new password**
- After saving: Password changed.
- If the link has expired: This reset link has expired. Ask for a new one. Link: Send a new link

### Page not found

- Title: **Page not found**
- Body: This page does not exist or has moved.
- Link: Go to the start page

### Setup needed (shown only when the app has no Supabase keys)

- Title: **Setup needed**
- Body: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the .env file, then restart the app.

### Account could not load

- Title: **We could not load your account**
- Body: Try again in a moment. If this keeps happening, tell your mentor.
- Buttons: Try again · Sign out

---

## Student screens

Menu: Home · Profile · My idea · Progress · Lessons · Notices. Account area: {full name} · Sign out.

### Home (`/student`)

- Title: **Hello, {first name}.**
- Line: Here is where you stand.
- Two facts: Hub: {hub name, or "Not chosen yet"} · Mentor: {mentor name, or "Not assigned yet"}

If staff flagged the record, a note at the top:

- Title: Please check your details
- Body: {the staff note}. If there is no note: A mentor has asked you to confirm your details. Open your profile and check that everything is correct.
- Link: Open your profile

Four steps, each a row with a status and one link:

1. **Your profile**
   - Complete → status "Complete", link "View profile"
   - Not complete → status "{n} details missing", link "Complete your profile"
2. **Your business idea**
   - None → status "Not added yet", line "No idea yet? Add it when you have one.", link "Add your idea"
   - Added → status is the stage label, line is the business name (or the start of the idea), link "View idea"
3. **Your progress**
   - No idea → status "Add your idea first"
   - No videos → line "Post a short video to move up a stage.", link "Post a video"
   - Waiting → status "Waiting for review", line "A mentor will watch your video."
   - Verified → status "Verified", line "Last video verified on {date}."
   - Not accepted → status "Not accepted", line "Read the feedback and try again."
   - Link in every case with an idea: "Open progress"
4. **Lessons**
   - status "{done} of {total} done", link "Open lessons"
   - None → status "No lessons yet"

### Profile (`/student/profile`)

- Title: **Your profile**
- Line: CBE uses these details for the incubation register. Keep them correct.

**About you**

- Full name
- Registration number. Hint: As on your student ID, like 03.12345.01.01.2026.
- Gender (Male / Female)
- Phone number. Hint: A number we can reach you on.
- Email (cannot be edited). Hint: You cannot change your email here.

**Your studies**

- Campus
- Department
- Programme. Hint: Not on the list? Leave it empty and tell your mentor. Before a department is chosen the dropdown reads: Choose a department first
- Level of study
- Expected graduation year

**Your hub**

- Cluster
- Innovation hub. Hint: Choose one hub. Your mentor comes from this hub.

**Support you want**

- Line: Tick everything that would help you.
- One checkbox per support type.

Button: **Save profile**. After saving: Profile saved.

### My idea (`/student/idea`)

- Title: **Your business idea**
- Line, before an idea exists: Tell us about the business or project you want to build. You can add one idea.
- Your idea. Hint: What will you sell or do, and for whom? Two or three sentences is enough.
- Business name (optional)
- Business sector
- Do you already run this business? (Yes / No)
- What stage is it at? One option per stage, each with its one-line meaning. Hint: Choose honestly. After this, only a mentor can change the stage. (Shown only the first time.)
- Button: **Save idea**. After saving: Idea saved.

Once the idea exists, the stage is shown, not asked:

- Stage: {label}
- Line: Only a mentor can change the stage. To move up, post a progress video.
- Link: Post a progress video

### Progress (`/student/progress`)

- Title: **Your progress**
- A four-step tracker: Idea Stage → Prototype Stage → Operational → Revenue Generating, with the current one marked.

With no idea yet:

- Title: Add your business idea first
- Body: Progress videos belong to an idea.
- Link: Add your idea

Form, titled **Post a progress video**:

- Line: Record a short video that shows your progress. Upload it to YouTube as Unlisted, then paste the link here. A mentor will watch it.
- Which stage does the video show? (only stages above the current one)
- YouTube link
- Note for your mentor (optional)
- Button: **Send to mentor**. After sending: Sent. A mentor will review your video.

Instead of the form:

- While a video is waiting: Your video is waiting for a mentor. You can post another one after it is reviewed.
- At the last stage: You have reached the last stage. Well done.

List, titled **Your videos**, newest first. Each row:

- {Stage label} · Sent {date} · {status}
- Link: Watch video
- Your note, if any
- Mentor feedback: {feedback}, if any
- Empty: No videos yet.

### Lessons (`/student/lessons`)

- Title: **Lessons**
- Line: Short videos from your mentors. Tick each one when you finish it.
- Progress: {done} of {total} done
- Each lesson: title, description, a tag (For your hub / For everyone), button **Watch**, link "Open in YouTube", checkbox "Done"
- Empty title: No lessons yet. Body: Your mentors will post lessons here.

### Notices (`/student/notices`)

- Title: **Notices**
- Line: Meetings and news from your mentors.
- Section **Coming up**: each meeting with a tag (For you / For your hub / For everyone), title, date and time like "Wed 18 Nov 2026, 14:00", the note, link **Join meeting**. A meeting stays here for 2 hours after it starts. Empty: No meetings coming up.
- Section **Notices**: newest first. Each with date, a "New" mark if posted since the last visit, title, message, link "Open link" if there is one. Empty: No notices yet.
- Home gets a fifth step, **Meetings and notices**: status "{n} new" when there are new notices; line "Next meeting: {title}, {date and time}." or "No meetings coming up."; link "Open notices".

---

### Messages (`/student/messages`, `/staff/messages`)

- Title: Messages. Button: **New message** (search: "Search by name or hub"; Cancel).
- Empty list: student "No messages yet. Write to your mentor with New message." / staff "No conversations yet. Start one with New message."
- Empty chat: "No messages yet. Say hello." Nothing open: "Choose a conversation, or start one with New message."
- Box: "Write a message…", button **Send** (Ctrl+Enter also sends). Staff choose a type first: Message · Support · Instruction · Correction.
- Not allowed: "You cannot write to this person." Not set up yet: "Messages are not switched on yet. Please try again later."
- Who can write to whom: a student and the mentors of their hub; an admin and anyone; both ways.

## Staff screens (mentors and admins)

A mentor sees only the students in the hubs an admin gave them. An admin sees every hub. The screens are the same; the database decides what each person gets.

Menu: Overview · Students · Reviews · Lessons · Meetings · Notices. Admins also get: People · Lists.

### Overview (`/staff`)

- Greeting: small line "Administrator · CBE Incubation Hub" (or Mentor), then **Good morning / Good afternoon / Good evening, Mr./Ms. Surname.** (full name when no gender is set).

- Title: **Overview**
- Line for a mentor: Your hubs: {hub, hub}. Line for an admin: All hubs.
- Four numbers: Students · With an idea · Videos waiting · Records to confirm
- Table **By stage**: Stage | Students, one row per stage plus "No idea yet". A stage opens the Students list filtered to it.
- Table **By hub**: Hub | Students | With an idea | Videos waiting
- Table **By campus**: Campus | Students | With an idea | Videos waiting
- In both tables, a hub or campus opens the Students list filtered to it. Students with none chosen show as "Not chosen yet".

A mentor with no hubs:

- Title: No hubs assigned yet
- Body: Ask an admin to assign your hubs. Until then you will not see any students.

### Students (`/staff/students`)

- Title: **Students**
- Search. Placeholder: Name, registration number or email
- Campus filter: All campuses, then each campus
- Hub filter: All hubs, then each hub
- Programme filter: All programmes, then each programme that a student in the list is studying
- Stage filter: Any stage, each stage, No idea yet
- Checkbox: To confirm only
- Count: {n} students
- Button: **Download Excel**. While working: Preparing file… If it fails: Could not make the file. Try again.
- Each row: full name, registration number, hub, stage (or "No idea yet"), a "Video waiting" mark when a video needs review, and a "To confirm" mark when flagged. The row opens the student.
- Empty, with filters: No students match. Empty, without: No students yet.

### One student (`/staff/students/{id}`)

- Link back: All students
- Title: {full name}
- Under it: {registration number} · {hub}
- At a glance, before the details: the stage tracker (or "No idea yet"), then Profile: Complete / {n} details missing · Videos waiting: {n} · Lessons: {done} of {total} done

**Details**: every profile field, read-only. Button: Edit details. For a mentor, the hub cannot be changed. Hint beside it: Only an admin can move a student to another hub.

**Business idea**: the idea, business name, sector, "Runs this business: Yes / No". If none: No idea yet.

- Stage, as a dropdown, with button: Save stage. Confirm: Change the stage to {label}?
- Mentor, as a dropdown (No mentor, then names), with button: Save mentor.

**Support requested**: the list. If none: None ticked.

**Progress videos**: every video with its status. A waiting video shows the review controls from the Reviews screen. If none: No videos yet.

**Details to confirm**

- Checkbox: These details need confirming
- Reason. Hint: The student can read this note.
- Button: Save

**Innovation hub** (admins only)

- Dropdown of hubs, button: Move student. Confirm: Move {name} to {hub}?

### Reviews (`/staff/reviews`)

- Title: **Videos to review**
- Two tabs: Waiting ({n}) · Reviewed
- Each waiting video: student name (opens the student), hub, "Now: {current stage}", "Video shows: {stage}", the video, the student's note
- Feedback for the student. Hint: Needed if you do not accept the video.
- Buttons: **Verify and move to {stage}** · Do not accept
- After verifying: Verified. {name} is now at {stage}.
- After rejecting: Marked as not accepted.
- If someone else got there first: This video was already reviewed.
- Warning when the video's stage is not above the current stage: This video shows a stage that is not above the student's current stage. Verifying will set the stage to {stage}.
- Empty title: Nothing to review. Body: New videos from your students will show up here.

### Lessons (`/staff/lessons`)

- Title: **Lessons**
- Button: **Add a lesson**
- Each row: order number, title, who it is for (Everyone, or the hub), Published or Draft, link: Edit
- Empty title: No lessons yet. Body: Add the first lesson for your students.

Form:

- Title
- Description (optional)
- YouTube link. Hint: Upload to YouTube as Unlisted and paste the link.
- Who is it for? (Everyone, then hubs)
- Order. Hint: Lower numbers come first.
- Checkbox: Published. Hint: Students see a lesson only when it is published.
- Buttons: **Save lesson** · Cancel · Delete lesson
- Confirm delete: Delete this lesson? Students' ticks for it are deleted too.
- After saving: Lesson saved. After deleting: Lesson deleted.

### Meetings (`/staff/meetings`)

- Title: **Meetings**
- Line: Plan an online class or call. Students see it on their Notices page.
- Button: **Plan a meeting**
- Sections **Coming up** and **Past** (last 20). Each row: title, date and time · who it is for, link Join, link Edit. Empty: No meetings planned.

Form:

- Title
- Date and time
- Meeting link. Hint: Create the meeting in Google Meet, Zoom or Teams, then paste its link. Error: Paste a meeting link that starts with https://
- Who is it for? Admin: Everyone, each hub, One student. Mentor: Choose…, their hubs, One student. With One student, a Student dropdown appears.
- Note (optional). Hint: What the meeting is about, or what to prepare.
- Buttons: **Save meeting** · Cancel · Delete meeting
- Confirm delete: Delete this meeting? Students will no longer see it.
- After saving: Meeting saved. After deleting: Meeting deleted.

### Notices (`/staff/notices`)

- Title: **Notices**
- Line: Tell a group of students something: a new lesson, a deadline, an event.
- Button: **Post a notice**
- Each row: title, date · who it is for ("Everyone", or the choices joined like "Dar es Salaam · Accountancy"), link Edit. Empty title: No notices yet. Body: Post the first one for your students.

Form:

- Title
- Message
- Link (optional). Hint: A web page students can open, like a form, a document or a new lesson.
- **Who is it for?** Hint: Students see the notice only if they match every choice. Leave a choice empty to include everyone.
  - Campus (All campuses) · Hub (admin: All hubs; mentor: Choose…, must pick one of their hubs) · Programme (All programmes)
- Buttons: **Post notice** (or Save notice when editing) · Cancel · Delete notice
- Confirm delete: Delete this notice? Students will no longer see it.
- After: Notice posted. / Notice saved. / Notice deleted.

---

## Admin screens

### People (`/admin/people`)

- Title: **People and roles**
- Line: Make someone a mentor, then choose the hubs they look after. A mentor with no hubs sees no students.

**Mentors and admins**: each person with name, email, a role dropdown and, for a mentor, a tick list of hubs with button: Save hubs.

**Find a person**

- Search. Placeholder: Name or email
- Up to 20 results, each with name, email and a role dropdown.
- Empty: No one matches.

Confirms:

- Make {name} a mentor?
- Make {name} an admin? Admins can see and change everything.
- Change {name} back to student? They will lose access to student records.

Own row: You cannot change your own role.

After saving: Saved.

### Lists (`/admin/lists`)

- Title: **Dropdown lists**
- Line: These are the choices students see on the forms. Renaming a choice changes it everywhere. You cannot delete a choice that is in use.
- Tabs: Campuses · Departments · Programmes · Levels of study · Clusters · Hubs · Business sectors · Support types
- Each row: Name, plus the extra field for that list, and buttons Save and Delete. Last row: empty fields and button Add.
- Extra fields: Departments have Code. Programmes have Department. Levels of study have Order. Hubs have Short name. Hint: Used as the Excel tab name. 31 characters at most.
- Confirm delete: Delete "{name}"?
- After saving: Saved. After deleting: Deleted.

---

## Excel file

- Button label: Download Excel
- File name for a mentor: `CBE Incubation Hub - My Hubs - {yyyy-mm-dd}.xlsx`
- File name for an admin: `CBE Incubation Hub - All Hubs - {yyyy-mm-dd}.xlsx`
- Mentor file: one tab per hub they look after, with only those students.
- Admin file: a tab called "All Hubs" with everyone, then one tab per hub.
- Tab names use the hub's short name.
- Plain black and white: bold header row, thin borders, no colours.
- Columns, in this order: No. · Full Name · Registration Number · Gender · Campus · Department · Programme · Level of Study · Expected Graduation Year · Phone Number · Email · Cluster · Innovation Hub · Business Idea / Project · Business Sector · Business Name · Owns a Business · Business Stage · Support Requested · Mentor

---

## Front page (v3, 16 Nov 2026)

CBE turned down the earlier front pages, so the page at `/` was rebuilt to Josh's **davidecarusio.it** layout and motion (Lorem capture `D:\Lorem\Inspections\davidecarusio.it 2026-11-16 2125`). Words and pictures are CBE's own; nothing from that site is used. Code: `src/pages/Landing.jsx`, `src/pages/landing.css`, `src/components/FlowGradient.jsx`.

**Look**: Geist (weight 600, tight -0.04em tracking) for everything, Geist Mono for small uppercase labels. **Blue and white** (Josh, 16 Nov 2026): near-white #F7F9FD, navy words #0B1A33, deep blue #0A2463 for the dark sections, muted #4B5A78, lines #D3DBEB, one bright blue #1D4ED8 for tags, button hovers and the dot grid (light blue #60A5FA near the mouse). Square-ish corners (2px), thin lines between blocks, fine grain over the page. On computers the whole page scales with the window (1rem = 16px at 1440px wide).

**Header**: Josh's two-pill navbar, kept exactly as before (Josh, 16 Nov 2026: "don't change my navbar"): About · How it works · Stages · FAQ · ⋮ menu (What we do, How it works, The four stages, Questions, Call us) · Sign in · **Join**. Only the 4th link changed, from "Inside" to "FAQ", because that section is gone. Pills and menu are now the page's white (#F7F9FD) with a hairline edge; the hover pill behind a link is light blue (Josh, 16 Nov 2026).

**Loader** (first visit in a browser session, never with reduced motion): dark sheet, "CBE Incubation Hub" wipes in, "every idea" → "needs a hub" at the bottom, bar fills, sheet lifts.

**Hero**: Josh's FlowGradient in blue and white (white base, light blue #BFD3FF flowing, a touch of #1D4ED8), it drifts with the cursor; right of centre:
- **Turn your idea into a real business.** For CBE students who want more than a class project.
- Join one of 22 innovation hubs, work with a mentor in your field and grow your business from idea to first sale, one stage at a time.
- Button: **Create your account ↗**
- On arrival the words rise one after another out of their lines and the button comes up.
- Bottom: COLLEGE OF BUSINESS EDUCATION, a line, then **Incubation Hub** huge across the width in **Funnel Display** ExtraBold (free on Google Fonts; the display font davidecarusio.it loads). It fades up slowly while its two words ease outward, and as you scroll the words keep drifting apart (4rem each way). No campus names anywhere on the front page (Josh, 16 Nov 2026).
- Scrolling down, dark bars grow over the hero.

**Statements** (`#about`, deep blue fading to white, dot grid that turns light blue near the mouse): Why does a good idea need a hub? → Most student ideas never leave the notebook. → Here, yours gets a mentor, a path and a stage.

**How it works** (`#how`): four rows, a small drawing left (26rem wide, 4:3), words right. Mouse-over: a light-blue panel wipes up behind the drawing, the drawing lifts, an arrow ↗ slides in beside the title and a "Get started" label follows the mouse (no videos, Josh 16 Nov 2026). On touch screens the arrow is always shown.
1. Join your hub: Sign up with the email you gave CBE. Your student details fill in by themselves. Tags: Sign up · CBE email
2. Describe your idea: Write your business down in plain words and pick the hub that fits it. Tags: 22 hubs · One idea each
3. Share your progress: Each time your business moves forward, post a short video link for your mentor. Tags: Video link · Mentor review
4. Move up a stage: When your mentor approves the video, you move to the next stage. Lessons and meetings help you get there. Tags: Lessons · Meetings

**The four stages** (`#stages`, dark): big list Idea · Prototype · Operational · Earning; the picture and line on the left follow the one you point at (tap on phones). Idea: Describe your business and pick the hub that fits it. · Prototype: Build a first version with your mentor's feedback. · Operational: Open for customers and post your progress videos. · Earning: Make your first sales and keep growing. Then, lighting up letter by letter: One hub, one mentor, one clear path. Your idea, your videos and your mentor's feedback stay together, so you always know what to do next.

**Questions** (`#faq`, dark): **Questions students ask us most.** One answer open at a time. Mouse-over a question: a lighter band fills the row and the question slides right.
- Who can join? Any student of the College of Business Education, on any campus.
- Which email should I use? The one you gave CBE when you registered. When you confirm it, your CBE details fill in by themselves.
- I don't have an idea yet. Can I still join? Yes. Create your account now and add your idea when you have one.
- What is a hub? A group for one field, like FinTech, Agribusiness or Tourism. There are 22 hubs, and your mentor comes from yours.
- How do I move up a stage? Post a short video link that shows your progress. Your mentor watches it; once it is approved, you move to the next stage.
- Who can see my idea? You, your hub's mentors and the Incubation Hub administrators. Other students cannot.
- Then: Still have a question? Give us a call. · **Call +255 627 375 912 ↗**
- "Does it cost anything?" stays off the page until CBE answers it.

**Footer**: EXPLORE (How it works, The stages, Questions, Back to top ↑) · YOUR ACCOUNT (Sign in, Create an account) · CONTACT (Call us ↗) · © {year} College of Business Education · Incubation Hub · **Incubation Hub** huge across the bottom; its two words slide together as the footer comes up.

Pictures: drawings in `public/dashboard`, the office photo `public/landing/hub-hero.webp`. The clips in `public/landing/tools` are no longer used by any page. Change which picture a row uses in the `STEPS` / `STAGES` lists at the top of `Landing.jsx`.
