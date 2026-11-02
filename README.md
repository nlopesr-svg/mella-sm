# Social Media OS (independent build)

A private social media client workspace built with Next.js App Router, TypeScript, and Supabase. This is a **first working code foundation**, not a finished or production-audited app.

## Local setup
1. Create a Supabase project. Run `supabase/schema.sql` in its SQL editor **on a new database** (the SQL creates policies without IF NOT EXISTS).
2. Copy `.env.example` to `.env.local`, fill the Supabase project URL and publishable/anon key. **Never paste a service-role key into NEXT_PUBLIC variables.**
3. Run `npm install`, then `npm run build`, then `npm run dev`.
4. Create an account through `/login`. Supabase may require email confirmation.
5. Deploy from a **private GitHub repository** to Vercel, setting the same two public environment variables in project settings. Confirm hosting plan eligibility for intended work use.

## Implemented in code
- Email/password signup, login, sign-out, reset email
- User-isolated client directory, search, create, edit, archive/restore
- Client overview, platform assignment, brand guidelines and per-platform strategies
- Knowledge notes, file uploads (private Supabase Storage), feedback entries
- Dashboard with actual client counts and recent clients, basic profile settings
- Responsive dark/lime UI

## Still required before real use
- Run dependency install/build and correct any issues; verify database policies and auth in a live Supabase project
- Populate initial 15 clients and platform associations (not seeded automatically yet)
- Dashboard widget customization, editable/deletable notes, document deletion, language toggle, improved validation, and UX polish
- Password reset redirect flow and more comprehensive security and accessibility testing
- Future tasks, calendar, intelligence, reporting, search and notifications

**Security:** SQL RLS isolates user data. The storage bucket is private. Never commit `.env.local`. For production, review storage policies and upload validation. Client deletion is disabled via grants and is not exposed in UI.
