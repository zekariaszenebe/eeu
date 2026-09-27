import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { HUB_RECORDS, HubRecord } from "./src/data/hubData";
import { INITIAL_FEEDERS_LIST, INITIAL_CUSTOMER_CONTACTS, INITIAL_INTERRUPTIONS } from "./src/data/mockData";

dotenv.config();

// Extract and sanitize Supabase URL and Key robustly
function extractValidSupabaseUrl(): string {
  const DEFAULT_SUPABASE_URL = 'https://lwgprtxopdonxtmjmgqm.supabase.co';
  const candidates = [
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_URL,
    DEFAULT_SUPABASE_URL
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string') {
      const trimmed = c.trim();
      if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.startsWith('sb_')) {
        let clean = trimmed.replace(/\/rest\/v1\/?$/, '');
        if (clean.includes('.supabase.com')) {
          clean = clean.replace('.supabase.com', '.supabase.co');
        }
        return clean;
      }
    }
  }
  return DEFAULT_SUPABASE_URL;
}

function extractValidSupabaseKey(): string {
  const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z3BydHhvcGRvbnh0bWptZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Nzc2MzAsImV4cCI6MjEwMzM1MzYzMH0.3Zpj--H_E3A8lpI2UyjB3Nkh3-xbmLXOEwHu8lrXE-o';
  const candidates = [
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_URL,
    DEFAULT_KEY
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string') {
      const trimmed = c.trim();
      if ((trimmed.startsWith('eyJ') || trimmed.startsWith('sb_')) && !trimmed.startsWith('http')) {
        return trimmed;
      }
    }
  }
  return DEFAULT_KEY;
}

const SUPABASE_URL = extractValidSupabaseUrl();
const SUPABASE_ANON_KEY = extractValidSupabaseKey();

// Server-side Supabase client (runs in Google Cloud, completely bypassing company IT firewalls)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Default initial team leaders
const DEFAULT_TEAM_LEADERS = [
  { id: 'admin-1', username: 'admin', password: '@Eeu1234', name: 'System Administrator', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() },
  { id: 'agent-1', username: 'contactcenter', password: '@Eeu1234', name: 'Contact Center Agent', district: 'Team A', role: 'agent', createdAt: new Date().toISOString() },
  { id: 'tl-1', username: 'teamleader', password: '@Eeu1234', name: 'Team Leader', district: 'Team D', role: 'team_leader', createdAt: new Date().toISOString() },
  { id: 'tl-d', username: 'zz01641821', password: 'eeu1234', name: 'Zekarias Zenebe', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() }
];

// Resilient in-memory database cache for fallback and fast responses
const db = {
  interruptions: [...INITIAL_INTERRUPTIONS] as any[],
  notifications: [] as any[],
  presetFeeders: INITIAL_FEEDERS_LIST.map((f, idx) => ({ id: `feeder-${idx}`, feederStr: f })),
  hubRecords: HUB_RECORDS.map(r => ({ ...r })),
  teamLeaderNotes: [] as any[],
  customerContacts: [...INITIAL_CUSTOMER_CONTACTS],
  teamLeaders: [...DEFAULT_TEAM_LEADERS] as any[],
  feedbacks: [] as any[]
};

// Track active Server-Sent Events (SSE) connections for instant multi-user broadcast
const sseClients = new Set<express.Response>();

function broadcastSse(topic: string, data?: any) {
  const payload = `data: ${JSON.stringify({ topic, timestamp: Date.now(), data })}\n\n`;
  for (const client of Array.from(sseClients)) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Background sync from Supabase into memory cache on boot
async function initServerDatabase() {
  try {
    const { data: intData, error: intErr } = await supabase.from('interruptions').select('*').order('id', { ascending: false });
    if (!intErr && Array.isArray(intData) && intData.length > 0) {
      db.interruptions = intData;
      console.log(`[Server Proxy] Loaded ${intData.length} interruptions from Supabase`);
    } else if (intErr) {
      console.warn('[Server Proxy] Supabase interruptions fetch notice:', intErr.message);
    }
  } catch (err: any) {
    console.warn('[Server Proxy] Initial interruptions sync failed:', err?.message);
  }

  try {
    const { data: notiData, error: notiErr } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    if (!notiErr && Array.isArray(notiData)) {
      db.notifications = notiData;
    }
  } catch {}

  try {
    const { data: tlData, error: tlErr } = await supabase.from('teamLeaders').select('*');
    if (!tlErr && Array.isArray(tlData) && tlData.length > 0) {
      db.teamLeaders = tlData;
    } else if (!tlErr && (!tlData || tlData.length === 0)) {
      await supabase.from('teamLeaders').insert(DEFAULT_TEAM_LEADERS);
    }
  } catch {}

  try {
    const { data: hubData, error: hubErr } = await supabase.from('hubRecords').select('*');
    if (!hubErr && Array.isArray(hubData) && hubData.length > 0) {
      const currentMap = new Map(hubData.map(r => [r.no.toString(), r]));
      db.hubRecords = HUB_RECORDS.map(master => {
        const found = currentMap.get(master.no.toString());
        return found ? { ...master, ...found } : { ...master };
      });
    }
  } catch {}
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize DB data from Supabase
  initServerDatabase().catch(err => console.error('[Server DB Init Error]:', err));

  // ==========================================
  // SERVER STATUS & HEALTH CHECK
  // ==========================================
  app.get("/api/proxy-status", async (req, res) => {
    let supabaseConnected = false;
    let interruptionCount = db.interruptions.length;
    try {
      const { data, error } = await supabase.from('interruptions').select('id', { count: 'exact' });
      if (!error) {
        supabaseConnected = true;
        if (data) interruptionCount = data.length;
      }
    } catch {
      supabaseConnected = false;
    }

    res.json({
      ok: true,
      mode: 'server-proxy',
      companyFirewallBypass: true,
      supabaseConnected,
      interruptionCount,
      activeSseClients: sseClients.size,
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // REAL-TIME SERVER-SENT EVENTS (SSE)
  // Replaces direct browser Supabase Realtime channel
  // Works cleanly through all corporate firewalls!
  // ==========================================
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders?.();

    sseClients.add(res);

    res.write(`data: ${JSON.stringify({ topic: "connected", timestamp: Date.now() })}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // ==========================================
  // 1. FEEDER INTERRUPTIONS PROXY
  // ==========================================
  app.get("/api/interruptions", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('interruptions')
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data)) {
        db.interruptions = data;
        return res.json(data);
      }
      if (error) {
        console.warn('[Proxy GET /interruptions Supabase warning]:', error.message);
      }
    } catch (err: any) {
      console.warn('[Proxy GET /interruptions fallback error]:', err?.message);
    }
    // Return resilient memory database
    res.json(db.interruptions);
  });

  app.post("/api/interruptions", async (req, res) => {
    const item = { ...req.body };
    const id = (item.id || '').trim() || `f-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestampStr = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Explicitly map ONLY the exact columns in Supabase interruptions table schema
    // Guarantees non-null string values so PostgreSQL constraints never reject the write
    const supabaseRecord = {
      id,
      feederName: (item.feederName || '').trim() || 'Feeder Line',
      district: (item.district || '').trim() || 'Team A',
      type: item.type || 'Earth Fault',
      status: item.status || 'Active',
      startTime: item.startTime || timestampStr,
      estimatedRestorationTime: item.estimatedRestorationTime || 'N/A',
      affectedArea: item.affectedArea || '',
      remark: item.remark || '',
      lastUpdated: item.lastUpdated || timestampStr
    };

    // Client response and memory object includes direction for UI display
    const clientRecord = {
      ...supabaseRecord,
      direction: item.direction || 'North'
    };

    // Update server memory cache immediately
    db.interruptions = [clientRecord, ...db.interruptions.filter(i => i.id !== id)];

    // Create system notification
    const noti = {
      id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      feederId: id,
      type: 'new',
      title: 'New Feeder Added',
      message: `${supabaseRecord.feederName} (${supabaseRecord.district}) logged under ${supabaseRecord.status}. Affected: ${supabaseRecord.affectedArea || 'N/A'}`,
      timestamp: timestampStr,
      read: false
    };
    db.notifications = [noti, ...db.notifications];

    // Save directly to Supabase
    try {
      const { error: insErr } = await supabase.from('interruptions').insert(supabaseRecord);
      if (insErr) {
        console.error('[Supabase Insert Error]:', insErr);
      } else {
        console.log(`[Supabase Insert Success]: ${id} - ${supabaseRecord.feederName}`);
      }
      await supabase.from('notifications').insert(noti);
    } catch (err: any) {
      console.error('[Proxy POST /interruptions Supabase Exception]:', err?.message);
    }

    // Push real-time update to all connected agent terminals instantly
    broadcastSse("interruptions", clientRecord);
    broadcastSse("notifications", noti);

    res.json(clientRecord);
  });

  app.put("/api/interruptions/:id", async (req, res) => {
    const { id } = req.params;
    const existing = db.interruptions.find(i => i.id === id);
    const timestampStr = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Clean payload with ONLY columns existing in Supabase table
    const updatePayload: Record<string, any> = {
      lastUpdated: timestampStr
    };
    if (req.body.feederName !== undefined) updatePayload.feederName = (req.body.feederName || '').trim() || 'Feeder Line';
    if (req.body.district !== undefined) updatePayload.district = req.body.district;
    if (req.body.type !== undefined) updatePayload.type = req.body.type;
    if (req.body.status !== undefined) updatePayload.status = req.body.status;
    if (req.body.startTime !== undefined) updatePayload.startTime = req.body.startTime || timestampStr;
    if (req.body.estimatedRestorationTime !== undefined) updatePayload.estimatedRestorationTime = req.body.estimatedRestorationTime || 'N/A';
    if (req.body.affectedArea !== undefined) updatePayload.affectedArea = req.body.affectedArea || '';
    if (req.body.remark !== undefined) updatePayload.remark = req.body.remark || '';

    const updated = {
      ...(existing || {}),
      ...updatePayload,
      direction: req.body.direction || existing?.direction || 'North',
      id
    };

    // Check if status changed to RESTORED or updated
    let changeNoti: any = null;
    if (req.body.status && existing && req.body.status !== existing.status) {
      const isRestored = req.body.status === 'RESTORED' || req.body.status === 'Restored' || req.body.status === 'Resolved';
      changeNoti = {
        id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        feederId: id,
        type: isRestored ? 'resolve' : 'update',
        title: isRestored ? 'Feeder Line Restored' : 'Operational Status Changed',
        message: isRestored
          ? `${updated.feederName} restored to active grid status and re-energized successfully.`
          : `${updated.feederName} reassessed as ${req.body.status}. Details: ${req.body.remark || updated.remark}`,
        timestamp: timestampStr,
        read: false
      };
      db.notifications = [changeNoti, ...db.notifications];
    }

    // Update memory
    const idx = db.interruptions.findIndex(i => i.id === id);
    if (idx !== -1) {
      db.interruptions[idx] = updated;
    } else {
      db.interruptions.push(updated);
    }

    // Forward to Supabase
    try {
      const { error: updErr } = await supabase.from('interruptions').update(updatePayload).eq('id', id);
      if (updErr) {
        console.error('[Supabase Update Error]:', updErr);
      } else {
        console.log(`[Supabase Update Success]: ${id} -> status: ${updated.status}`);
      }
      if (changeNoti) {
        await supabase.from('notifications').insert(changeNoti);
      }
    } catch (err: any) {
      console.error('[Proxy PUT /interruptions Supabase Exception]:', err?.message);
    }

    // Push real-time event to all agents
    broadcastSse("interruptions", updated);
    if (changeNoti) {
      broadcastSse("notifications", changeNoti);
    }

    res.json(updated);
  });

  app.delete("/api/interruptions/:id", async (req, res) => {
    const { id } = req.params;
    db.interruptions = db.interruptions.filter(i => i.id !== id);

    try {
      await supabase.from('interruptions').delete().eq('id', id);
    } catch (err: any) {
      console.warn('[Proxy DELETE /interruptions Supabase error]:', err?.message);
    }

    broadcastSse("interruptions", { deletedId: id });
    res.json({ success: true });
  });

  // ==========================================
  // 2. NOTIFICATIONS PROXY
  // ==========================================
  app.get("/api/notifications", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && Array.isArray(data)) {
        db.notifications = data;
        return res.json(data);
      }
    } catch {}
    res.json(db.notifications);
  });

  app.post("/api/notifications", async (req, res) => {
    const item = { ...req.body };
    db.notifications = [item, ...db.notifications];

    try {
      await supabase.from('notifications').insert(item);
    } catch {}

    broadcastSse("notifications", item);
    res.json(item);
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    const { id } = req.params;
    const noti = db.notifications.find(n => n.id === id);
    if (noti) noti.read = true;

    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch {}

    broadcastSse("notifications", { id, read: true });
    res.json({ success: true });
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    db.notifications.forEach(n => n.read = true);

    try {
      await supabase.from('notifications').update({ read: true }).neq('id', '');
    } catch {}

    broadcastSse("notifications", { allRead: true });
    res.json({ success: true });
  });

  app.delete("/api/notifications", async (req, res) => {
    db.notifications = [];

    try {
      await supabase.from('notifications').delete().neq('id', '');
    } catch {}

    broadcastSse("notifications", { cleared: true });
    res.json({ success: true });
  });

  // ==========================================
  // 3. PRESET FEEDERS PROXY
  // ==========================================
  app.get("/api/presetFeeders", async (req, res) => {
    try {
      const { data, error } = await supabase.from('presetFeeders').select('feederStr');
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data.map((f: any) => f.feederStr));
      }
    } catch {}
    res.json(db.presetFeeders.map(f => f.feederStr));
  });

  app.post("/api/presetFeeders", async (req, res) => {
    const feederStr = req.body.feederStr;
    const item = { id: `feeder-${Date.now()}`, feederStr };
    db.presetFeeders.push(item);

    try {
      await supabase.from('presetFeeders').insert(item);
    } catch {}

    broadcastSse("presetFeeders");
    res.json(item);
  });

  app.post("/api/presetFeeders/bulk", async (req, res) => {
    if (req.body.feeders && Array.isArray(req.body.feeders)) {
      db.presetFeeders = req.body.feeders.map((f: string, idx: number) => ({
        id: `feeder-${idx}-${Date.now()}`,
        feederStr: f
      }));
      try {
        await supabase.from('presetFeeders').delete().neq('id', '');
        await supabase.from('presetFeeders').insert(db.presetFeeders);
      } catch {}
    }
    broadcastSse("presetFeeders");
    res.json({ success: true });
  });

  app.delete("/api/presetFeeders/:feederStr", async (req, res) => {
    const { feederStr } = req.params;
    db.presetFeeders = db.presetFeeders.filter(f => f.feederStr !== feederStr);

    try {
      await supabase.from('presetFeeders').delete().eq('feederStr', feederStr);
    } catch {}

    broadcastSse("presetFeeders");
    res.json({ success: true });
  });

  app.put("/api/presetFeeders", async (req, res) => {
    const { oldFeederStr, newFeederStr } = req.body;
    const item = db.presetFeeders.find(f => f.feederStr === oldFeederStr);
    if (item) {
      item.feederStr = newFeederStr;
      try {
        await supabase.from('presetFeeders').update({ feederStr: newFeederStr }).eq('feederStr', oldFeederStr);
      } catch {}
      broadcastSse("presetFeeders");
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // ==========================================
  // 4. HUB RECORDS PROXY
  // ==========================================
  app.get("/api/hubRecords", async (req, res) => {
    try {
      const { data, error } = await supabase.from('hubRecords').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        const currentMap = new Map(data.map((r: any) => [r.no.toString(), r]));
        db.hubRecords = HUB_RECORDS.map(master => {
          const found = currentMap.get(master.no.toString());
          return found ? { ...master, ...found } : { ...master };
        });
        return res.json(db.hubRecords.sort((a, b) => (a.no || 0) - (b.no || 0)));
      }
    } catch {}
    res.json(db.hubRecords.sort((a, b) => (a.no || 0) - (b.no || 0)));
  });

  app.put("/api/hubRecords/:no", async (req, res) => {
    const num = parseInt(req.params.no, 10);
    const idx = db.hubRecords.findIndex(h => h.no === num);
    if (idx !== -1) {
      db.hubRecords[idx] = { ...db.hubRecords[idx], ...req.body, no: num };
    } else {
      db.hubRecords.push({ ...req.body, no: num });
    }

    try {
      await supabase.from('hubRecords').upsert({ ...req.body, no: num });
    } catch {}

    broadcastSse("hubRecords");
    res.json(db.hubRecords.find(h => h.no === num));
  });

  app.post("/api/hubRecords/bulk", async (req, res) => {
    if (Array.isArray(req.body.records)) {
      for (const record of req.body.records) {
        const idx = db.hubRecords.findIndex(h => h.no === record.no);
        if (idx !== -1) {
          db.hubRecords[idx] = { ...db.hubRecords[idx], ...record };
        } else {
          db.hubRecords.push(record);
        }
      }
      try {
        await supabase.from('hubRecords').upsert(req.body.records);
      } catch {}
    }
    broadcastSse("hubRecords");
    res.json({ success: true });
  });

  app.post("/api/hubRecords/reset", async (req, res) => {
    db.hubRecords = HUB_RECORDS.map(r => ({ ...r }));
    try {
      await supabase.from('hubRecords').delete().neq('no', -1);
      await supabase.from('hubRecords').insert(db.hubRecords);
    } catch {}
    broadcastSse("hubRecords");
    res.json({ success: true, records: db.hubRecords });
  });

  // ==========================================
  // 5. TEAM LEADER NOTES PROXY
  // ==========================================
  app.get("/api/teamLeaderNotes", async (req, res) => {
    try {
      const { data, error } = await supabase.from('teamLeaderNotes').select('*');
      if (!error && Array.isArray(data)) {
        db.teamLeaderNotes = data;
        return res.json(data);
      }
    } catch {}
    res.json(db.teamLeaderNotes);
  });

  app.post("/api/teamLeaderNotes", async (req, res) => {
    const item = { ...req.body };
    db.teamLeaderNotes = [item, ...db.teamLeaderNotes];

    try {
      await supabase.from('teamLeaderNotes').insert(item);
    } catch {}

    broadcastSse("teamLeaderNotes", item);
    res.json(item);
  });

  app.put("/api/teamLeaderNotes/:id", async (req, res) => {
    const { id } = req.params;
    const idx = db.teamLeaderNotes.findIndex(i => i.id === id);
    if (idx !== -1) {
      db.teamLeaderNotes[idx] = { ...db.teamLeaderNotes[idx], ...req.body };
      try {
        await supabase.from('teamLeaderNotes').update(req.body).eq('id', id);
      } catch {}
      broadcastSse("teamLeaderNotes", db.teamLeaderNotes[idx]);
      res.json(db.teamLeaderNotes[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/teamLeaderNotes/:id", async (req, res) => {
    const { id } = req.params;
    db.teamLeaderNotes = db.teamLeaderNotes.filter(i => i.id !== id);

    try {
      await supabase.from('teamLeaderNotes').delete().eq('id', id);
    } catch {}

    broadcastSse("teamLeaderNotes", { deletedId: id });
    res.json({ success: true });
  });

  app.delete("/api/teamLeaderNotes", async (req, res) => {
    db.teamLeaderNotes = [];

    try {
      await supabase.from('teamLeaderNotes').delete().neq('id', '');
    } catch {}

    broadcastSse("teamLeaderNotes", { cleared: true });
    res.json({ success: true });
  });

  // ==========================================
  // 6. CUSTOMER CONTACTS PROXY
  // ==========================================
  app.get("/api/customerContacts", async (req, res) => {
    try {
      const { data, error } = await supabase.from('customerContacts').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        db.customerContacts = data;
        return res.json(data);
      }
    } catch {}
    res.json(db.customerContacts);
  });

  app.post("/api/customerContacts", async (req, res) => {
    const item = { ...req.body };
    db.customerContacts.push(item);

    try {
      await supabase.from('customerContacts').insert(item);
    } catch {}

    broadcastSse("customerContacts", item);
    res.json(item);
  });

  app.put("/api/customerContacts/:id", async (req, res) => {
    const { id } = req.params;
    const idx = db.customerContacts.findIndex(i => i.id === id);
    if (idx !== -1) {
      db.customerContacts[idx] = { ...db.customerContacts[idx], ...req.body };
      try {
        await supabase.from('customerContacts').update(req.body).eq('id', id);
      } catch {}
      broadcastSse("customerContacts", db.customerContacts[idx]);
      res.json(db.customerContacts[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/customerContacts/:id", async (req, res) => {
    const { id } = req.params;
    db.customerContacts = db.customerContacts.filter(i => i.id !== id);

    try {
      await supabase.from('customerContacts').delete().eq('id', id);
    } catch {}

    broadcastSse("customerContacts", { deletedId: id });
    res.json({ success: true });
  });

  // ==========================================
  // 7. TEAM LEADERS & USERS PROXY
  // ==========================================
  app.get("/api/teamLeaders", async (req, res) => {
    try {
      const { data, error } = await supabase.from('teamLeaders').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        db.teamLeaders = data;
        return res.json(data);
      }
    } catch {}
    res.json(db.teamLeaders);
  });

  app.post("/api/teamLeaders", async (req, res) => {
    const item = { ...req.body };
    db.teamLeaders.push(item);

    try {
      await supabase.from('teamLeaders').insert(item);
    } catch {}

    broadcastSse("teamLeaders", item);
    res.json(item);
  });

  app.put("/api/teamLeaders/:id", async (req, res) => {
    const { id } = req.params;
    const idx = db.teamLeaders.findIndex(i => i.id === id);
    if (idx !== -1) {
      db.teamLeaders[idx] = { ...db.teamLeaders[idx], ...req.body };
      try {
        await supabase.from('teamLeaders').update(req.body).eq('id', id);
      } catch {}
      broadcastSse("teamLeaders", db.teamLeaders[idx]);
      res.json(db.teamLeaders[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/teamLeaders/:id", async (req, res) => {
    const { id } = req.params;
    db.teamLeaders = db.teamLeaders.filter(i => i.id !== id);

    try {
      await supabase.from('teamLeaders').delete().eq('id', id);
    } catch {}

    broadcastSse("teamLeaders", { deletedId: id });
    res.json({ success: true });
  });

  // ==========================================
  // 8. FEEDBACKS PROXY
  // ==========================================
  app.post("/api/feedbacks", async (req, res) => {
    const item = { ...req.body };
    db.feedbacks.push(item);

    try {
      await supabase.from('feedbacks').insert(item);
    } catch {}

    res.json(item);
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EEU Server] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[EEU Server] Supabase proxy active. Client browsers will never contact supabase.co directly.`);
  });
}

startServer();
