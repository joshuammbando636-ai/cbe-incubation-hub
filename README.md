# CBE Incubation Hub

Students at the College of Business Education sign in and register their startup ideas. Mentors follow the students in their hubs. See `CLAUDE.md` for the rules and `content.md` for every screen's wording.

## Run it locally

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the project URL and **anon** key (Supabase → Project Settings → API). Never the service-role key.
3. `npm run dev`

Without the keys the app shows "Setup needed".

## Supabase setup (once)

1. Run `supabase/schema.sql` in the SQL editor of a fresh project. (Already ran an older copy? Run the files in `supabase/migrations/` in order instead.)
2. Authentication → Sign In / Providers → Email: keep **Confirm email** ON.
3. Authentication → URL Configuration:
   - Site URL: the live address, e.g. `https://cbe-incubation-hub.vercel.app`
   - Redirect URLs: add `http://localhost:5173/**` and `https://<live address>/**`.
   Email links land on `/auth/callback` (confirm) and `/reset-password` (reset). If the address is not on this list, the links will not work.
4. Sign up in the app, then make yourself admin (see the end of `schema.sql`).

The built-in Supabase mailer sends only a few emails per hour. Before real students sign up, add an SMTP sender under Authentication → Emails.

## Checks

- `npm test`: form checks, plus the database rules (schema loaded into an in-memory Postgres, no Supabase needed)
- `npm run lint`
- `npm run build`

## Deploy

Vercel picks up the Vite build. `vercel.json` sends every path to `index.html` so links like `/auth/callback` work. Add the same two `VITE_` variables in the Vercel project settings.
