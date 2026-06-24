-- Supabase SQL Editor: run this once to create the PDF unlock request queue.
create extension if not exists pgcrypto;

create table if not exists public.pdf_access_requests (
  id uuid primary key default gen_random_uuid(),
  file_name text not null check (char_length(trim(file_name)) between 1 and 300),
  file_url text not null,
  file_type text not null default 'PDF',
  requester_name text not null constraint pdf_access_requests_requester_name_chk check (char_length(trim(requester_name)) between 2 and 120),
  requester_email text not null constraint pdf_access_requests_requester_email_chk check (
    char_length(trim(requester_email)) between 5 and 180
    and requester_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  requester_phone text not null constraint pdf_access_requests_requester_phone_chk check (char_length(trim(requester_phone)) between 5 and 40),
  request_reason text not null constraint pdf_access_requests_request_reason_chk check (char_length(trim(request_reason)) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pdf_access_requests
add column if not exists file_name text;

alter table public.pdf_access_requests
add column if not exists file_url text;

alter table public.pdf_access_requests
add column if not exists file_type text not null default 'PDF';

alter table public.pdf_access_requests
add column if not exists requester_name text;

alter table public.pdf_access_requests
add column if not exists requester_email text;

alter table public.pdf_access_requests
add column if not exists requester_phone text;

alter table public.pdf_access_requests
add column if not exists request_reason text;

alter table public.pdf_access_requests
add column if not exists status text not null default 'pending';

alter table public.pdf_access_requests
add column if not exists created_at timestamptz not null default now();

alter table public.pdf_access_requests
add column if not exists updated_at timestamptz not null default now();

update public.pdf_access_requests
set file_name = 'unknown_pdf'
where file_name is null or trim(file_name) = '';

update public.pdf_access_requests
set file_url = 'unknown_url'
where file_url is null or trim(file_url) = '';

update public.pdf_access_requests
set requester_name = 'legacy_visitor'
where requester_name is null or trim(requester_name) = '';

update public.pdf_access_requests
set requester_email = 'unknown@example.com'
where requester_email is null or trim(requester_email) = '';

update public.pdf_access_requests
set requester_phone = 'not_provided'
where requester_phone is null or trim(requester_phone) = '';

update public.pdf_access_requests
set request_reason = 'Legacy request imported before visitor reason was required.'
where request_reason is null or trim(request_reason) = '';

alter table public.pdf_access_requests
alter column file_name set not null;

alter table public.pdf_access_requests
alter column file_url set not null;

alter table public.pdf_access_requests
alter column requester_name set not null;

alter table public.pdf_access_requests
alter column requester_email set not null;

alter table public.pdf_access_requests
alter column requester_phone set not null;

alter table public.pdf_access_requests
alter column request_reason set not null;

alter table public.pdf_access_requests
alter column status set default 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pdf_access_requests_requester_name_chk'
  ) then
    alter table public.pdf_access_requests
    add constraint pdf_access_requests_requester_name_chk
    check (char_length(trim(requester_name)) between 2 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pdf_access_requests_requester_email_chk'
  ) then
    alter table public.pdf_access_requests
    add constraint pdf_access_requests_requester_email_chk
    check (
      char_length(trim(requester_email)) between 5 and 180
      and requester_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pdf_access_requests_requester_phone_chk'
  ) then
    alter table public.pdf_access_requests
    add constraint pdf_access_requests_requester_phone_chk
    check (char_length(trim(requester_phone)) between 5 and 40);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pdf_access_requests_request_reason_chk'
  ) then
    alter table public.pdf_access_requests
    add constraint pdf_access_requests_request_reason_chk
    check (char_length(trim(request_reason)) between 10 and 1000);
  end if;
end;
$$;

alter table public.pdf_access_requests enable row level security;

drop policy if exists "Visitors can request PDF access" on public.pdf_access_requests;

create policy "Visitors can request PDF access"
on public.pdf_access_requests
for insert
to anon
with check (status = 'pending');

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant insert, select, update on public.pdf_access_requests to anon;
grant insert, select, update on public.pdf_access_requests to authenticated;

create index if not exists pdf_access_requests_status_created_at_idx
on public.pdf_access_requests (status, created_at desc);

create or replace function public.touch_pdf_access_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pdf_access_requests_touch_updated_at on public.pdf_access_requests;
create trigger pdf_access_requests_touch_updated_at
before update on public.pdf_access_requests
for each row
execute function public.touch_pdf_access_requests_updated_at();

create or replace function public.get_pdf_access_requests_for_admin(admin_passcode text)
returns setof public.pdf_access_requests
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
  from public.pdf_access_requests
  order by created_at desc nulls last;
end;
$$;

create or replace function public.set_pdf_access_request_status(
  request_id uuid,
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
    raise exception 'Invalid request status';
  end if;

  update public.pdf_access_requests
  set status = new_status
  where id = request_id;
end;
$$;

grant execute on function public.get_pdf_access_requests_for_admin(text) to anon;
grant execute on function public.get_pdf_access_requests_for_admin(text) to authenticated;
grant execute on function public.set_pdf_access_request_status(uuid, text, text) to anon;
grant execute on function public.set_pdf_access_request_status(uuid, text, text) to authenticated;

create or replace function public.delete_pdf_access_request_for_admin(
  admin_passcode text,
  request_id text
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

  delete from public.pdf_access_requests
  where id::text = request_id::text;
end;
$$;

grant execute on function public.delete_pdf_access_request_for_admin(text, uuid) to anon;
grant execute on function public.delete_pdf_access_request_for_admin(text, uuid) to authenticated;
grant execute on function public.delete_pdf_access_request_for_admin(uuid, text) to anon;
grant execute on function public.delete_pdf_access_request_for_admin(uuid, text) to authenticated;
grant execute on function public.delete_pdf_access_request_for_admin(text, text) to anon;
grant execute on function public.delete_pdf_access_request_for_admin(text, text) to authenticated;

notify pgrst, 'reload schema';
