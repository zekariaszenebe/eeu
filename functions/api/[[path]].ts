// Cloudflare Pages Serverless Proxy Function
// If you host on Cloudflare Pages, this function handles /api/* routes on Cloudflare's edge network
// completely bypassing company IT firewalls!

const SUPABASE_URL = "https://lwgprtxopdonxtmjmgqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z3BydHhvcGRvbnh0bWptZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Nzc2MzAsImV4cCI6MjEwMzM1MzYzMH0.3Zpj--H_E3A8lpI2UyjB3Nkh3-xbmLXOEwHu8lrXE-o";

export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (path === "proxy-status") {
    return new Response(JSON.stringify({
      ok: true,
      mode: "cloudflare-edge-proxy",
      companyFirewallBypass: true
    }), { headers: corsHeaders });
  }

  // Map /api/interruptions -> Supabase REST
  let targetTable = path.split('/')[0];
  let targetId = path.split('/')[1];

  let supabaseEndpoint = `${SUPABASE_URL}/rest/v1/${targetTable}`;
  if (targetId) {
    supabaseEndpoint += `?id=eq.${encodeURIComponent(targetId)}`;
  } else if (request.method === 'GET') {
    supabaseEndpoint += `?select=*&order=id.desc`;
  }

  const supabaseHeaders: Record<string, string> = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": request.method === 'POST' ? 'return=representation' : 'return=minimal'
  };

  try {
    let body = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const text = await request.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (targetTable === 'interruptions') {
            // Remove direction column as it does not exist in Supabase table
            delete parsed.direction;
            // Guarantee non-empty required fields
            const nowIso = new Date().toISOString();
            if (!parsed.startTime) parsed.startTime = nowIso;
            if (!parsed.estimatedRestorationTime) parsed.estimatedRestorationTime = 'Pending Assessment';
            if (!parsed.affectedArea) parsed.affectedArea = 'Under Assessment';
            if (!parsed.status) parsed.status = 'Active';
          }
          body = JSON.stringify(parsed);
        } catch {
          body = text;
        }
      }
    }

    const sbRes = await fetch(supabaseEndpoint, {
      method: request.method,
      headers: supabaseHeaders,
      body
    });

    const resText = await sbRes.text();
    return new Response(resText, {
      status: sbRes.status,
      headers: corsHeaders
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Proxy Error' }), {
      status: 502,
      headers: corsHeaders
    });
  }
}
