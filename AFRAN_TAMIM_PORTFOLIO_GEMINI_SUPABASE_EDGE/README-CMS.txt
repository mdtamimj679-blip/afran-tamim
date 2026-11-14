# AFRAN ADMIN CMS — Online Edition

This package contains your existing AFRAN TAMIM V3 portfolio (including the current portrait and showcase video) plus a Supabase-backed owner CMS starter.

## What is implemented
- Owner password login using Supabase Auth (no public sign-up form).
- Admin authorization checked against `site_admins`.
- Draft and published content stored in PostgreSQL (`site_state`).
- Persistent image/video uploads in Supabase Storage.
- Owner-only database and storage write policies (RLS).
- Public site reads only the published JSON through a read-only RPC.
- CMS controls for profile/contact, portfolio projects, friends, skills/services, tools, appearance and section visibility/order.

## Important status
The code is built and syntax-checked, but it is NOT online or connected to a live database yet. That requires your Supabase project URL/key and a hosting account. Never paste a database password or Supabase service-role key into website code or chat.

## Setup (Supabase)
1. Create a Supabase project at https://supabase.com/dashboard.
2. In Authentication > Users, create your owner user with your email and a strong unique password. Keep the password private.
3. Open SQL Editor and run all of `supabase/schema.sql`.
4. Copy the owner user's UUID from Authentication > Users. In SQL Editor, run:
   ```sql
   insert into public.site_admins (user_id)
   values ('PASTE_OWNER_USER_UUID_HERE')
   on conflict do nothing;
   ```
5. In Project Settings > API, copy the Project URL and anon/publishable key.
6. Put them in `config.js`:
   - `SUPABASE_URL`: your Project URL
   - `SUPABASE_ANON_KEY`: your anon/publishable key
   The anon key is designed for browser use only with RLS enabled. Never use the service_role key here.
7. Deploy the whole folder to a static host that supports HTTPS (for example Netlify, Vercel or Cloudflare Pages). Keep `index.html`, `admin.html`, `config.js`, `cms.js`, `public-cms.js`, `assets/` and `supabase/` together.
8. In Supabase Authentication > URL Configuration, set the Site URL to your live domain and add the live domain to Redirect URLs.
9. Open `https://YOUR-DOMAIN/admin.html`, sign in with the owner account, save a draft, then publish.
10. Open the public domain to view published content.

## Local preview
After configuring `config.js`, run a local static server from this folder (not `file://`):
- Python: `python -m http.server 8000`
- Then open `http://localhost:8000/` and `http://localhost:8000/admin.html`.

## Notes / limitations to finish after deployment
- This CMS scaffold is connected to the existing public portfolio through a published-content bridge. Verify the exact selectors/layout in the browser after deployment; the existing site design is preserved.
- The CMS stores and publishes uploaded projects and friend records. Some existing visual sections may need a small selector-specific polish pass to match the site's original cards perfectly.
- Friend profile photos are optional until the real files are uploaded.
- Browser-only static hosting cannot run a private server-side process; Supabase provides the managed auth/database/storage backend.
- Keep the SQL file private to the project admin workflow and never expose service-role secrets.
