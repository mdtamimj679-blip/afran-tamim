-- AFRAN ADMIN CMS — Supabase PostgreSQL setup
-- Run this entire file in Supabase SQL Editor AFTER creating the first owner
-- account in Authentication > Users. Then replace OWNER_AUTH_USER_UUID below
-- with that user's UUID and run the final INSERT statement.

create extension if not exists pgcrypto;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

create table if not exists public.site_state (
  id integer primary key check (id = 1),
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  updated_by uuid references auth.users(id)
);

insert into public.site_state (id) values (1)
on conflict (id) do nothing;

alter table public.site_state enable row level security;
grant select, update on public.site_state to authenticated;

drop policy if exists "Owner can read CMS state" on public.site_state;
create policy "Owner can read CMS state"
on public.site_state for select to authenticated
using (public.is_site_admin());

drop policy if exists "Owner can update CMS state" on public.site_state;
create policy "Owner can update CMS state"
on public.site_state for update to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

create or replace function public.get_published_site_content()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select published from public.site_state where id = 1;
$$;

revoke all on function public.get_published_site_content() from public;
grant execute on function public.get_published_site_content() to anon, authenticated;

-- Persistent public-read / admin-write media bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  524288000,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view portfolio assets" on storage.objects;
create policy "Public can view portfolio assets"
on storage.objects for select
using (bucket_id = 'portfolio-assets');

drop policy if exists "Owner can upload portfolio assets" on storage.objects;
create policy "Owner can upload portfolio assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-assets' and public.is_site_admin());

drop policy if exists "Owner can update portfolio assets" on storage.objects;
create policy "Owner can update portfolio assets"
on storage.objects for update to authenticated
using (bucket_id = 'portfolio-assets' and public.is_site_admin())
with check (bucket_id = 'portfolio-assets' and public.is_site_admin());

drop policy if exists "Owner can delete portfolio assets" on storage.objects;
create policy "Owner can delete portfolio assets"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-assets' and public.is_site_admin());

-- Add your owner account UUID here after creating it in Supabase Auth:
-- insert into public.site_admins (user_id)
-- values ('OWNER_AUTH_USER_UUID')
-- on conflict do nothing;
