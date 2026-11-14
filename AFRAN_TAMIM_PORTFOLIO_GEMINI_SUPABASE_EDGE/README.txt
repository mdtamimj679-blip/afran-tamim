AFRAN TAMIM PORTFOLIO V3 — GEMINI EDGE FUNCTION PACKAGE

Deploy this folder as the website root. It includes the public portfolio, private Admin CMS, Supabase schema and Gemini AI Edge Function.

Before using Admin or Gemini:
1. Configure config.js with your Supabase Project URL and anon/publishable key.
2. Run supabase/schema.sql in Supabase SQL Editor and ensure the owner is listed in public.site_admins.
3. Add GEMINI_API_KEY to Supabase Edge Function Secrets.
4. Deploy with: supabase functions deploy gemini-ai
5. Open /admin.html, sign in, then choose Gemini AI in the sidebar.

Read SETUP.md for the full instructions. The Gemini key is server-side only and must never be added to browser files.

The original large showcase MP4 is not bundled in the deployable folder. Upload it from Admin > Profile & Contact > Featured showcase video after Supabase is connected.
