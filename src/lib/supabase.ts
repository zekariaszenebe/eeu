import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || 
  'https://lwgprtxopdonxtmjmgqm.supabase.co';

const SUPABASE_ANON_KEY = 
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z3BydHhvcGRvbnh0bWptZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Nzc2MzAsImV4cCI6MjEwMzM1MzYzMH0.3Zpj--H_E3A8lpI2UyjB3Nkh3-xbmLXOEwHu8lrXE-o';

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
