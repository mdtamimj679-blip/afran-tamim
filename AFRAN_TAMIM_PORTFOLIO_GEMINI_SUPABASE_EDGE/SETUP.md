# AFRAN TAMIM Portfolio V3 — Gemini AI + Supabase Edge Function

## What is included
- Existing portfolio, Admin CMS, assets, Friend Circle images and visual theme.
- Gemini AI assistant inside the owner Control Panel (`/admin.html` → **Gemini AI**).
- A Supabase Edge Function at `supabase/functions/gemini-ai/index.ts`.
- Server-side owner authorization: the function requires a valid Supabase user session and `public.is_site_admin() = true`.
- Gemini API key is read only from the Supabase Edge Function secret `GEMINI_API_KEY`; it is never placed in browser files.
- Gemini uses Google's Interactions API and defaults to `gemini-3.8-flash`.

## 1. Configure Supabase for the website
1. In your existing Supabase project, run the complete `supabase/schema.sql` in SQL Editor. This is required for Admin CMS, storage and the `is_site_admin()` authorization function.
2. Confirm your owner user is present in `public.site_admins`.
3. In `config.js`, replace only `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your Supabase Project URL and anon/publishable key. Never place a service-role/secret key in `config.js`.
4. In Supabase Authentication → URL Configuration, allow your live website origin and `/admin.html`.
5. Deploy the website folder.

## 2. Add the Gemini API key securely
1. Create a Gemini API key in Google AI Studio.
2. In Supabase Dashboard → Edge Functions → Secrets, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
3. Do not add the Gemini key to `config.js`, HTML, JavaScript, Git, chat messages, or any public file. The key must remain in Supabase secrets.

## 3. Deploy the Edge Function
From the project root, install/authenticate the Supabase CLI, then run:

```bash
supabase login
supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
supabase functions deploy gemini-ai
```

The project includes `supabase/config.toml` with `verify_jwt = true`. The Edge Function also independently checks the signed-in user and verifies that they are a site admin before contacting Gemini.

The function URL is:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/gemini-ai
```

No Worker URL is needed. The website derives the function URL from `SUPABASE_URL`.

## 4. Use Gemini from the Control Panel
1. Open `/admin.html` and sign in with the owner account.
2. Select **Gemini AI** in the Control Panel sidebar.
3. Choose a supported Gemini Flash model, enter a prompt and click **Ask Gemini**.
4. The answer appears in the panel. This AI assistant does not automatically edit, save or publish website content.

## 5. Local Edge Function development (optional)
Copy `supabase/functions/.env.example` to `supabase/functions/.env` and replace the placeholder with your key. Keep `.env` private; it is ignored by Git.

```bash
supabase functions serve gemini-ai
```

## 6. Security and limitations
- The Gemini API key is server-side only.
- Only authenticated users in `site_admins` can call the AI function.
- The browser sends the user's Supabase access token and the public anon/publishable key; neither is a Gemini secret.
- The Edge Function limits prompts to 6,000 characters and applies a 45-second upstream timeout.
- Monitor Gemini API usage and configure provider-side quotas/budgets to control cost.
- The public portfolio AI section points visitors to the owner-only Control Panel assistant; it does not expose an unauthenticated Gemini endpoint.
- This offline package cannot be linked to or deployed into your private Supabase project. Add the secret and deploy the function using the steps above.

## 7. Existing CMS media setup
- Run `supabase/schema.sql` for the `portfolio-assets` bucket and owner-only storage policies.
- The package intentionally excludes the large local showcase MP4; upload it from Admin after Supabase is connected.
