# Portfolio Landing Page

## Supabase Contact Inbox

The contact form writes visitor messages to the `contact_messages` table. The admin page reads the same table at `/admin`.

1. In Supabase, open the SQL editor and run `supabase/contact_messages.sql`.
2. Run `supabase/site_reviews.sql` to create the visitor review queue.
3. Run `supabase/pdf_access_requests.sql` to create the PDF unlock request queue.
4. Run `supabase/admin_auth.sql` to create the admin OTP tables/functions.
5. Copy `.env.example` to `.env`.
6. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Project Settings > API.
7. Restart the Vite dev server after editing `.env`.

Register the admin Gmail address in Supabase SQL Editor:

```sql
insert into public.admin_accounts (email)
values ('zaldy.dagohoy.a@gmail.com')
on conflict (email) do update set is_active = true;
```

The hidden footer-logo admin login sends a 6-digit OTP to the registered Gmail address.

## Admin OTP Emails

When an admin requests a login code, the homepage calls `/api/send-admin-otp-email`. This route generates the OTP with the Supabase service role key and sends it through Gmail SMTP.

Set these server-side environment variables in Vercel Project Settings:

- `EMAIL_FROM`: the sender label, for example `Zaldy Dagohoy <zaldy.dagohoy.a@gmail.com>`.
- `EMAIL_REPLY_TO`: optional reply-to address, for example `zaldy.dagohoy.a@gmail.com`.
- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: your Supabase service role key. Keep this server-side only.
- `SITE_URL`: your deployed portfolio URL.

For email delivery, the app uses Gmail SMTP for admin OTP emails whenever `GMAIL_SMTP_USER` and `GMAIL_SMTP_APP_PASSWORD` are configured.

- Gmail SMTP:
  - `GMAIL_SMTP_USER`: the Gmail address that sends admin OTP messages.
  - `GMAIL_SMTP_APP_PASSWORD`: a Google app password for the sending Gmail account. Use the 16-character app password, not your normal Gmail password.

Use `npm run dev`, `npm run preview`, or Vercel when testing OTP emails. GitHub Pages or any static-only deploy will not run `api/send-admin-otp-email.js`.

To diagnose OTP delivery setup, replace `your-site.vercel.app` with your real Vercel deployment domain and open `https://your-site.vercel.app/api/send-admin-otp-email` in the browser. The literal placeholder URL will return a Vercel 404. The real endpoint should return JSON with `message: "Admin OTP email API is reachable."` and `config.smtpUser`, `config.smtpAppPassword`, `config.emailFrom`, `config.supabaseUrl`, and `config.supabaseServiceRoleKey` should all be `true`.

## PDF Approval Emails

When an admin approves a PDF access request, the admin page calls `/api/send-pdf-access-email` to email the requester a link to the approved PDF.

Set these server-side environment variables in Vercel Project Settings:

- `GMAIL_SMTP_USER`: the Gmail address that sends approval emails.
- `GMAIL_SMTP_APP_PASSWORD`: a Google app password for the sending Gmail account.
- `EMAIL_FROM`: the sender label, for example `Zaldy Dagohoy <zaldy.dagohoy.a@gmail.com>`.
- `EMAIL_REPLY_TO`: optional reply-to address, for example `zaldy.dagohoy.a@gmail.com`.
- `ADMIN_PASSCODE`: should match `VITE_ADMIN_PASSCODE`.
- `SITE_URL`: your deployed portfolio URL.

The request status is still updated even if email is not configured; the admin dashboard will show the email error.

Use `npm run dev`, `npm run preview`, or Vercel when testing approval emails. GitHub Pages or any static-only deploy will not run `api/send-pdf-access-email.js`, so no email can be sent from that route.

To diagnose delivery setup, replace `your-site.vercel.app` with your real Vercel deployment domain and open `https://your-site.vercel.app/api/send-pdf-access-email` in the browser. The literal placeholder URL will return a Vercel 404. The real endpoint should return JSON with `message: "PDF approval email API is reachable."` and `config.smtpUser`, `config.smtpAppPassword`, `config.emailFrom`, and `config.adminPasscode` should all be `true`.

Note: this is a static-site admin screen, so the anon key is used in the browser. For private production inboxes, move admin reads behind Supabase Auth, an Edge Function, or your backend.
