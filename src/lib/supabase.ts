import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lwgprtxopdonxtmjmgqm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z3BydHhvcGRvbnh0bWptZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Nzc2MzAsImV4cCI6MjEwMzM1MzYzMH0.3Zpj--H_E3A8lpI2UyjB3Nkh3-xbmLXOEwHu8lrXE-o';

// 1. Sanitize and autocorrect URL
let rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || DEFAULT_SUPABASE_URL;
// Common mistake: typing .supabase.com instead of .supabase.co
if (rawUrl.includes('.supabase.com')) {
  rawUrl = rawUrl.replace('.supabase.com', '.supabase.co');
}
const SUPABASE_URL = rawUrl;

// 2. Sanitize and autocorrect Anon Key
let rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || DEFAULT_SUPABASE_ANON_KEY;
// Common mistake: pasting sb_secret_... or CLI tokens instead of the public JWT anon key
if (rawKey.startsWith('sb_secret_') || !rawKey.startsWith('eyJ')) {
  console.warn('[Supabase Config] The provided VITE_SUPABASE_ANON_KEY is not a public anon JWT key. Falling back to project anon key.');
  rawKey = DEFAULT_SUPABASE_ANON_KEY;
}
const SUPABASE_ANON_KEY = rawKey;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_URL.includes('MY_SUPABASE') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

// Fallback placeholder credentials to prevent createClient from throwing on module evaluation when env vars are unconfigured
const clientUrl = isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
