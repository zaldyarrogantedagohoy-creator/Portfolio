import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Do not throw at module import time — provide a safe fallback and warn.
  // This allows the app to render even when env vars are not configured.
  // To enable Supabase, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.
  console.warn('Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export { supabase };
