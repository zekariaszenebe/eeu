import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  (import.meta.env?.VITE_SUPABASE_URL as string) || 
  'https://lwgprtxopdonxtmjmgqm.supabase.co';

const SUPABASE_ANON_KEY = 
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z3BydHhvcGRvbnh0bWptZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Nzc2MzAsImV4cCI6MjEwMzM1MzYzMH0.3Zpj--H_E3A8lpI2UyjB3Nkh3-xbmLXOEwHu8lrXE-o';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('MY_SUPABASE')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
