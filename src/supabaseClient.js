import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://iybendtdgpuvkgcqwken.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5YmVuZHRkZ3B1dmtnY3F3a2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjc4MjEsImV4cCI6MjA5NjY0MzgyMX0.eJCbtV4V5abwTfNFniH6N0GCfK7VkYH6scJ5Oiz0po0';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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
