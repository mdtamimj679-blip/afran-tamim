# Verification report — Gemini Edge Function integration

## Static checks passed
- `node --check cms.js`
- `node --check public-cms.js`
- `node --check` for the inline JavaScript in `index.html`
- TypeScript transpilation/syntax check for `supabase/functions/gemini-ai/index.ts`
- Confirmed Admin contains a separate Gemini AI tab and its controls have unique IDs.
- Confirmed Gemini API calls are made only from the Supabase Edge Function.
- Confirmed no `GEMINI_API_KEY` is present in browser-side files.
- Confirmed the old Cloudflare Worker endpoint/config references were removed.
- Confirmed the public website directs visitors to the owner-only Admin AI assistant.

## Not run — requires your private accounts / deployment
- Supabase Edge Function deployment and runtime invocation.
- Live Supabase Auth JWT and `is_site_admin()` authorization.
- Real Gemini API request and response.
- Live browser testing at mobile and desktop screen sizes.

## Required before live use
The supplied `config.js` intentionally contains Supabase placeholders. Configure it with your Supabase Project URL and public anon/publishable key, run `supabase/schema.sql`, add `GEMINI_API_KEY` in Supabase Edge Function Secrets, then deploy using `supabase functions deploy gemini-ai`. Do not put a Gemini key or Supabase service-role/secret key in frontend files.
