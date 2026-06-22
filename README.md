# Portfolio Landing Page

## Supabase Contact Inbox

The contact form writes visitor messages to the `contact_messages` table. The admin page reads the same table at `/admin`.

1. In Supabase, open the SQL editor and run `supabase/contact_messages.sql`.
2. Run `supabase/site_reviews.sql` to create the visitor review queue.
3. Run `supabase/pdf_access_requests.sql` to create the PDF unlock request queue.
4. Copy `.env.example` to `.env`.
5. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Project Settings > API.
6. Restart the Vite dev server after editing `.env`.

The hidden footer-logo admin login uses `VITE_ADMIN_PASSCODE`. The current fallback is `ZeilDhagz_0008`.

Note: this is a static-site admin screen, so the anon key is used in the browser. For private production inboxes, move admin reads behind Supabase Auth, an Edge Function, or your backend.
