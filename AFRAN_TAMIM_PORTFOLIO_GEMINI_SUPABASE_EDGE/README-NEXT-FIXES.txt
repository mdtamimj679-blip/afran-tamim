AFRAN TAMIM PORTFOLIO — UPDATED MAINTENANCE PACKAGE

Key changes:
- Isolated CMS list rendering so editing one collection does not rebuild unrelated sections.
- Friend-specific image upload and preview with unique storage object names.
- Khalid Bin Oalid Sam's supplied image and fallback record retained.
- Upload-aware Save/Publish handling and snapshot-based persistence.
- Unicode header compatibility handling for Supabase requests.
- Responsive mobile navigation and admin sidebar safeguards.
- Slightly more visible/frequent global glitch; other animation keyframes and timing remain unchanged.

Setup reminder:
1. Restore your real Supabase Project URL and anon/publishable key in config.js. This ZIP contains the original template placeholders.
3. Review supabase/schema.sql against your existing live project before applying it.
4. Test sign-in, admin authorization, Friend photo upload, Save Draft, Publish, and public content loading in your own configured environment.

Never put a Supabase service_role key in frontend config.js.

See AUDIT-STATUS.txt for the exact scope and verification limits.
