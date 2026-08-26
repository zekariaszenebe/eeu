import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrlRaw = process.env.SUPABASE_URL || "sb_publishable_ORXfYJUXKF6UUNXxIbAOLA_4gC1D4u2";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_secret_mVuxA_1CRv98aG8ENreRdg_NxsfR0gW";

const supabaseUrl = supabaseUrlRaw.startsWith("http") 
  ? supabaseUrlRaw 
  : (supabaseUrlRaw.includes(".") ? `https://${supabaseUrlRaw}` : `https://${supabaseUrlRaw}.supabase.co`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === Interruptions ===
  app.get("/api/interruptions", async (req, res) => {
    const { data, error } = await supabase.from('interruptions').select('*').order('lastUpdated', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/interruptions", async (req, res) => {
    const { data, error } = await supabase.from('interruptions').insert(req.body).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.put("/api/interruptions/:id", async (req, res) => {
    const { data, error } = await supabase.from('interruptions').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/interruptions/:id", async (req, res) => {
    const { error } = await supabase.from('interruptions').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // === Notifications ===
  app.get("/api/notifications", async (req, res) => {
    const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/notifications", async (req, res) => {
    const { data, error } = await supabase.from('notifications').insert(req.body).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/notifications", async (req, res) => {
    const { error } = await supabase.from('notifications').delete().neq('id', 'dummy_never_match');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // === Preset Feeders ===
  app.get("/api/presetFeeders", async (req, res) => {
    const { data, error } = await supabase.from('presetFeeders').select('feederStr');
    if (error) return res.status(500).json({ error: error.message });
    res.json((data || []).map(d => d.feederStr));
  });

  app.post("/api/presetFeeders", async (req, res) => {
    const { data, error } = await supabase.from('presetFeeders').insert(req.body).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });
  
  app.post("/api/presetFeeders/bulk", async (req, res) => {
    await supabase.from('presetFeeders').delete().neq('id', 'dummy_never_match');
    const batch = req.body.feeders.map((f: string, idx: number) => ({ id: `feeder-${idx}-${Date.now()}`, feederStr: f }));
    if(batch.length > 0) {
      const { error } = await supabase.from('presetFeeders').insert(batch);
      if (error) return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  app.delete("/api/presetFeeders/:feederStr", async (req, res) => {
    const { error } = await supabase.from('presetFeeders').delete().eq('feederStr', req.params.feederStr);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });
  
  app.put("/api/presetFeeders", async (req, res) => {
    const { error } = await supabase.from('presetFeeders').update({ feederStr: req.body.newFeederStr }).eq('feederStr', req.body.oldFeederStr);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // === Hub Records ===
  app.get("/api/hubRecords", async (req, res) => {
    const { data, error } = await supabase.from('hubRecords').select('*').order('no', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/hubRecords/:no", async (req, res) => {
    const { data, error } = await supabase.from('hubRecords').upsert(req.body, { onConflict: 'no' }).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });
  
  app.post("/api/hubRecords/bulk", async (req, res) => {
    const { error } = await supabase.from('hubRecords').upsert(req.body.records, { onConflict: 'no' });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // === Team Leader Notes ===
  app.get("/api/teamLeaderNotes", async (req, res) => {
    const { data, error } = await supabase.from('teamLeaderNotes').select('*').order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/teamLeaderNotes", async (req, res) => {
    const { data, error } = await supabase.from('teamLeaderNotes').insert(req.body).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.put("/api/teamLeaderNotes/:id", async (req, res) => {
    const { data, error } = await supabase.from('teamLeaderNotes').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/teamLeaderNotes/:id", async (req, res) => {
    const { error } = await supabase.from('teamLeaderNotes').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/teamLeaderNotes", async (req, res) => {
    const { error } = await supabase.from('teamLeaderNotes').delete().neq('id', 'dummy_never_match');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // === Customer Contacts ===
  app.get("/api/customerContacts", async (req, res) => {
    const { data, error } = await supabase.from('customerContacts').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/customerContacts", async (req, res) => {
    const { data, error } = await supabase.from('customerContacts').insert(req.body).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.put("/api/customerContacts/:id", async (req, res) => {
    const { data, error } = await supabase.from('customerContacts').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/customerContacts/:id", async (req, res) => {
    const { error } = await supabase.from('customerContacts').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // === Team Leaders ===
  app.get("/api/teamLeaders", async (req, res) => {
    const { data, error } = await supabase.from('teamLeaders').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/teamLeaders", async (req, res) => {
    const { data, error } = await supabase.from('teamLeaders').insert(req.body).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.put("/api/teamLeaders/:id", async (req, res) => {
    const { data, error } = await supabase.from('teamLeaders').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  app.delete("/api/teamLeaders/:id", async (req, res) => {
    const { error } = await supabase.from('teamLeaders').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // === Feedbacks ===
  app.post("/api/feedbacks", async (req, res) => {
    const { data, error } = await supabase.from('feedbacks').insert(req.body).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data?.[0]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
