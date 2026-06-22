-- Supabase SQL Editor: run this once to create the visitor review queue.
create extension if not exists pgcrypto;

create table if not exists public.site_reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_reviews
add column if not exists name text;

alter table public.site_reviews
add column if not exists rating integer;

alter table public.site_reviews
add column if not exists comment text;

alter table public.site_reviews
add column if not exists status text not null default 'pending';

alter table public.site_reviews
add column if not exists created_at timestamptz not null default now();

alter table public.site_reviews
add column if not exists updated_at timestamptz not null default now();

alter table public.site_reviews
alter column status set default 'pending';

alter table public.site_reviews enable row level security;

drop policy if exists "Visitors can submit reviews" on public.site_reviews;
drop policy if exists "Visitors can read approved reviews" on public.site_reviews;

create policy "Visitors can submit reviews"
on public.site_reviews
for insert
to anon
with check (status = 'pending' and rating between 1 and 5);

create policy "Visitors can read approved reviews"
on public.site_reviews
for select
to anon
using (status = 'approved');

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant insert, select on public.site_reviews to anon;
grant insert, select on public.site_reviews to authenticated;

create index if not exists site_reviews_status_created_at_idx
on public.site_reviews (status, created_at desc);

create or replace function public.touch_site_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_reviews_touch_updated_at on public.site_reviews;
create trigger site_reviews_touch_updated_at
before update on public.site_reviews
for each row
execute function public.touch_site_reviews_updated_at();

create or replace function public.get_site_reviews_for_admin(admin_passcode text)
returns setof public.site_reviews
language plpgsql
security definer
set search_path = public
as $$
begin
  if admin_passcode <> 'ZeilDhagz_0008' then
    raise exception 'Invalid admin passcode';
  end if;

  return query
  select *
  from public.site_reviews
  order by created_at desc nulls last;
end;
$$;

create or replace function public.set_site_review_status(
  review_id uuid,
  new_status text,
  admin_passcode text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if admin_passcode <> 'ZeilDhagz_0008' then
    raise exception 'Invalid admin passcode';
  end if;

  if new_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid review status';
  end if;

  update public.site_reviews
  set status = new_status
  where id = review_id;
end;
$$;

grant execute on function public.get_site_reviews_for_admin(text) to anon;
grant execute on function public.get_site_reviews_for_admin(text) to authenticated;
grant execute on function public.set_site_review_status(uuid, text, text) to anon;
grant execute on function public.set_site_review_status(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
