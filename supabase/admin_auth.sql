-- Supabase SQL Editor: admin authentication with Gmail & OTP.
-- Safe to rerun: this preserves existing admin_accounts rows.
create extension if not exists pgcrypto;

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant usage on schema public to service_role;

-- Table to store admin accounts
create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(trim(email)) between 5 and 254),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_accounts enable row level security;

-- Table to store OTP codes (short-lived)
create table if not exists public.admin_otp (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_accounts(id) on delete cascade,
  otp_code text not null check (char_length(otp_code) = 6),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  verified_at timestamptz
);

alter table public.admin_otp enable row level security;

create index if not exists admin_otp_admin_id_idx on public.admin_otp(admin_id);
create index if not exists admin_otp_expires_at_idx on public.admin_otp(expires_at);
create unique index if not exists admin_otp_unique_unverified_idx on public.admin_otp(admin_id) where verified_at is null;

-- RPC: Register a new admin account (email)
create or replace function public.register_admin(
  admin_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  if admin_email is null or char_length(trim(admin_email)) < 5 then
    raise exception 'Invalid email';
  end if;

  -- Check if email already exists
  if exists (select 1 from public.admin_accounts where email = trim(lower(admin_email))) then
    raise exception 'Admin email already registered';
  end if;

  -- Insert new admin account
  insert into public.admin_accounts (email)
  values (trim(lower(admin_email)))
  returning id into admin_id;

  return admin_id;
end;
$$;

revoke all on function public.register_admin(text) from public;
revoke all on function public.register_admin(text) from anon;
revoke all on function public.register_admin(text) from authenticated;
grant execute on function public.register_admin(text) to service_role;


-- RPC: Generate OTP for the server email endpoint.
-- This returns the code only to the service role, never to browser clients.
create or replace function public.generate_admin_otp(
  admin_email text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_otp_code text;
  v_recent_otp_created_at timestamptz;
begin
  if admin_email is null or char_length(trim(admin_email)) < 5 then
    raise exception 'Invalid email';
  end if;

  -- Get admin account by email
  select id into v_admin_id from public.admin_accounts
  where email = trim(lower(admin_email)) and is_active = true;

  if v_admin_id is null then
    raise exception 'Admin account not found or inactive';
  end if;

  -- Prevent accidental or abusive resend loops.
  select created_at into v_recent_otp_created_at
  from public.admin_otp
  where admin_id = v_admin_id
    and verified_at is null
  order by created_at desc
  limit 1;

  if v_recent_otp_created_at is not null
     and v_recent_otp_created_at > now() - interval '60 seconds' then
    raise exception 'Please wait before requesting another OTP';
  end if;

  -- Delete any existing unverified OTP for this admin
  delete from public.admin_otp
  where admin_id = v_admin_id and verified_at is null;

  -- Generate a 6-digit OTP
  v_otp_code := lpad(floor(random() * 1000000)::text, 6, '0');

  -- Insert OTP record
  insert into public.admin_otp (admin_id, otp_code, expires_at)
  values (v_admin_id, v_otp_code, now() + interval '10 minutes');

  -- The serverless email route receives this and sends it to the admin Gmail.
  return v_otp_code;
end;
$$;

revoke all on function public.generate_admin_otp(text) from public;
revoke all on function public.generate_admin_otp(text) from anon;
revoke all on function public.generate_admin_otp(text) from authenticated;
grant execute on function public.generate_admin_otp(text) to service_role;


-- RPC: Verify OTP and return admin ID if valid
create or replace function public.verify_admin_otp(
  admin_email text,
  otp_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_valid_otp boolean;
  v_submitted_otp_code text;
begin
  v_submitted_otp_code := otp_code;

  if admin_email is null
     or v_submitted_otp_code is null
     or v_submitted_otp_code !~ '^[0-9]{6}$' then
    raise exception 'Missing email or OTP';
  end if;

  -- Get admin account
  select id into v_admin_id from public.admin_accounts
  where email = trim(lower(admin_email)) and is_active = true;

  if v_admin_id is null then
    raise exception 'Admin account not found or inactive';
  end if;

  -- Check if OTP is valid (correct code, not expired, not yet verified)
  select exists (
    select 1 from public.admin_otp ao
    where ao.admin_id = v_admin_id
      and ao.otp_code = v_submitted_otp_code
      and ao.expires_at > now()
      and ao.verified_at is null
  ) into v_valid_otp;

  if not v_valid_otp then
    raise exception 'Invalid or expired OTP';
  end if;

  -- Mark OTP as verified
  update public.admin_otp ao
  set verified_at = now()
  where ao.admin_id = v_admin_id
    and ao.otp_code = v_submitted_otp_code
    and ao.verified_at is null;

  return v_admin_id;
end;
$$;

revoke all on function public.verify_admin_otp(text, text) from public;
grant execute on function public.verify_admin_otp(text, text) to anon;
grant execute on function public.verify_admin_otp(text, text) to authenticated;


-- RPC: Check if an admin email is registered
create or replace function public.check_admin_exists(
  admin_email text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if admin_email is null then
    return false;
  end if;

  return exists (
    select 1 from public.admin_accounts
    where email = trim(lower(admin_email)) and is_active = true
  );
end;
$$;

revoke all on function public.check_admin_exists(text) from public;
revoke all on function public.check_admin_exists(text) from anon;
revoke all on function public.check_admin_exists(text) from authenticated;
grant execute on function public.check_admin_exists(text) to service_role;


notify pgrst, 'reload schema';
