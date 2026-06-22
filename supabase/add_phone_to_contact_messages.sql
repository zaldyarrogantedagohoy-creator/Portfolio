-- Supabase SQL Editor: run this to add the required phone column
-- to an existing public.contact_messages table.

alter table public.contact_messages
add column if not exists phone text;

update public.contact_messages
set email = 'missing-email@example.com'
where email is null or trim(email) = '';

update public.contact_messages
set phone = 'missing-phone'
where phone is null or trim(phone) = '';

alter table public.contact_messages
alter column email set not null;

alter table public.contact_messages
alter column phone set not null;

alter table public.contact_messages
drop constraint if exists contact_messages_email_length;

alter table public.contact_messages
add constraint contact_messages_email_length
check (char_length(trim(email)) between 3 and 180);

alter table public.contact_messages
drop constraint if exists contact_messages_phone_length;

alter table public.contact_messages
add constraint contact_messages_phone_length
check (char_length(trim(phone)) between 7 and 40);

notify pgrst, 'reload schema';
