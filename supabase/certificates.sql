-- Supabase SQL Editor: run this once to create the certificates table.
create extension if not exists pgcrypto;

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  image_url text not null check (char_length(trim(image_url)) between 1 and 500),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.certificates
add column if not exists title text;

alter table public.certificates
add column if not exists image_url text;

alter table public.certificates
add column if not exists display_order integer not null default 0;

alter table public.certificates
add column if not exists created_at timestamptz not null default now();

alter table public.certificates
add column if not exists updated_at timestamptz not null default now();

alter table public.certificates enable row level security;

drop policy if exists "Anyone can read certificates" on public.certificates;

create policy "Anyone can read certificates"
on public.certificates
for select
to anon
using (true);

-- Insert your current 3 verified certificates
insert into public.certificates (title, image_url, display_order)
values 
  ('UX Design Certificate', 'certificate-1.png', 1),
  ('Frontend Development Certificate', 'certificate-2.png', 2),
  ('Analytics Certificate', 'certificate-3.png', 3)
on conflict do nothing;
