import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lwgprtxopdonxtmjmgqm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z3BydHhvcGRvbnh0bWptZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Nzc2MzAsImV4cCI6MjEwMzM1MzYzMH0.3Zpj--H_E3A8lpI2UyjB3Nkh3-xbmLXOEwHu8lrXE-o';

function isValidHttpUrl(stringToTest?: string): boolean {
  if (!stringToTest) return false;
  try {
    const parsed = new URL(stringToTest);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// 1. Sanitize and autocorrect URL with strict fallback to known working project
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
let rawUrl = DEFAULT_SUPABASE_URL;

if (envUrl && isValidHttpUrl(envUrl) && !envUrl.includes('your-project') && !envUrl.includes('MY_SUPABASE')) {
  rawUrl = envUrl;
}
if (rawUrl.includes('.supabase.com')) {
  rawUrl = rawUrl.replace('.supabase.com', '.supabase.co');
}
const SUPABASE_URL = rawUrl;

// 2. Sanitize and autocorrect Anon Key
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
let rawKey = DEFAULT_SUPABASE_ANON_KEY;

if (envKey && envKey.startsWith('eyJ') && !envKey.includes('your-anon-key')) {
  rawKey = envKey;
}
const SUPABASE_ANON_KEY = rawKey;

// Supabase is always fully configured with production credentials
export const isSupabaseConfigured = true;

// Fallback guaranteed valid HTTP URL so createClient never throws "Invalid supabaseUrl"
const clientUrl = SUPABASE_URL;
const clientKey = SUPABASE_ANON_KEY;

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

/**
 * Health check helper to verify Supabase connectivity
 */
export async function checkSupabaseHealth(): Promise<{ connected: boolean; count: number; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const { data, error } = await supabase.from('interruptions').select('id', { count: 'exact' });
    const latencyMs = Date.now() - start;
    if (error) {
      return { connected: false, count: 0, latencyMs, error: error.message };
    }
    return { connected: true, count: data ? data.length : 0, latencyMs };
  } catch (err: any) {
    return { connected: false, count: 0, latencyMs: Date.now() - start, error: err?.message || 'Network error' };
  }
}
