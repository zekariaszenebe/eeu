import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { HUB_RECORDS } from "./src/data/hubData";
import { INITIAL_FEEDERS_LIST, INITIAL_CUSTOMER_CONTACTS, INITIAL_INTERRUPTIONS } from "./src/data/mockData";

// Mock In-Memory Database initialized with full baseline data
const db = {
  interruptions: [] as any[],
  notifications: [] as any[],
  presetFeeders: INITIAL_FEEDERS_LIST.map((f, idx) => ({ id: `feeder-${idx}`, feederStr: f })),
  hubRecords: HUB_RECORDS.map(r => ({ ...r })),
  teamLeaderNotes: [] as any[],
  customerContacts: [...INITIAL_CUSTOMER_CONTACTS],
  teamLeaders: [
    { id: 'admin-1', username: 'admin', password: '@Eeu1234', name: 'System Administrator', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() },
    { id: 'agent-1', username: 'contactcenter', password: '@Eeu1234', name: 'Contact Center Agent', district: 'Team A', role: 'agent', createdAt: new Date().toISOString() },
    { id: 'tl-1', username: 'teamleader', password: '@Eeu1234', name: 'Team Leader', district: 'Team D', role: 'team_leader', createdAt: new Date().toISOString() },
    { id: 'tl-d', username: 'zz01641821', password: 'eeu1234', name: 'Zekarias Zenebe', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() }
  ] as any[],
  feedbacks: [] as any[]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === Interruptions ===
  app.get("/api/interruptions", (req, res) => {
    res.json(db.interruptions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
  });

  app.post("/api/interruptions", (req, res) => {
    const item = { ...req.body };
    db.interruptions.push(item);
    res.json(item);
  });

  app.put("/api/interruptions/:id", (req, res) => {
    const idx = db.interruptions.findIndex(i => i.id === req.params.id);
    if (idx !== -1) {
      db.interruptions[idx] = { ...db.interruptions[idx], ...req.body };
      res.json(db.interruptions[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/interruptions/:id", (req, res) => {
    db.interruptions = db.interruptions.filter(i => i.id !== req.params.id);
    res.json({ success: true });
  });

  // === Notifications ===
  app.get("/api/notifications", (req, res) => {
    res.json(db.notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  });

  app.post("/api/notifications", (req, res) => {
    const item = { ...req.body };
    db.notifications.push(item);
    res.json(item);
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    const idx = db.notifications.findIndex(i => i.id === req.params.id);
    if (idx !== -1) {
      db.notifications[idx].read = true;
      res.json(db.notifications[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.put("/api/notifications/read-all", (req, res) => {
    db.notifications.forEach(n => n.read = true);
    res.json({ success: true });
  });

  app.delete("/api/notifications", (req, res) => {
    db.notifications = [];
    res.json({ success: true });
  });

  // === Preset Feeders ===
  app.get("/api/presetFeeders", (req, res) => {
    res.json(db.presetFeeders.map(f => f.feederStr));
  });

  app.post("/api/presetFeeders", (req, res) => {
    const item = { ...req.body, id: Date.now().toString() };
    db.presetFeeders.push(item);
    res.json(item);
  });
  
  app.post("/api/presetFeeders/bulk", (req, res) => {
    db.presetFeeders = [];
    if(req.body.feeders && req.body.feeders.length > 0) {
      db.presetFeeders = req.body.feeders.map((f: string, idx: number) => ({
        id: `feeder-${idx}-${Date.now()}`,
        feederStr: f
      }));
    }
    res.json({ success: true });
  });

  app.delete("/api/presetFeeders/:feederStr", (req, res) => {
    db.presetFeeders = db.presetFeeders.filter(f => f.feederStr !== req.params.feederStr);
    res.json({ success: true });
  });
  
  app.put("/api/presetFeeders", (req, res) => {
    const item = db.presetFeeders.find(f => f.feederStr === req.body.oldFeederStr);
    if (item) {
      item.feederStr = req.body.newFeederStr;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // === Hub Records ===
  app.get("/api/hubRecords", (req, res) => {
    // Ensure all 30 base records are always present
    if (!db.hubRecords || db.hubRecords.length === 0) {
      db.hubRecords = HUB_RECORDS.map(r => ({ ...r }));
    } else if (db.hubRecords.length < HUB_RECORDS.length) {
      const currentMap = new Map(db.hubRecords.map(r => [r.no.toString(), r]));
      db.hubRecords = HUB_RECORDS.map(master => {
        const found = currentMap.get(master.no.toString());
        return found ? { ...master, ...found } : { ...master };
      });
    }
    res.json(db.hubRecords.sort((a, b) => (a.no || 0) - (b.no || 0)));
  });

  app.put("/api/hubRecords/:no", (req, res) => {
    if (!db.hubRecords || db.hubRecords.length === 0) {
      db.hubRecords = HUB_RECORDS.map(r => ({ ...r }));
    } else if (db.hubRecords.length < HUB_RECORDS.length) {
      const currentMap = new Map(db.hubRecords.map(r => [r.no.toString(), r]));
      db.hubRecords = HUB_RECORDS.map(master => {
        const found = currentMap.get(master.no.toString());
        return found ? { ...master, ...found } : { ...master };
      });
    }

    const idx = db.hubRecords.findIndex(h => h.no.toString() === req.params.no.toString());
    if (idx !== -1) {
      db.hubRecords[idx] = { ...db.hubRecords[idx], ...req.body };
      res.json(db.hubRecords[idx]);
    } else {
      db.hubRecords.push(req.body);
      res.json(req.body);
    }
  });
  
  app.post("/api/hubRecords/bulk", (req, res) => {
    for (const record of req.body.records) {
      const idx = db.hubRecords.findIndex(h => h.no.toString() === record.no.toString());
      if (idx !== -1) {
        db.hubRecords[idx] = { ...db.hubRecords[idx], ...record };
      } else {
        db.hubRecords.push(record);
      }
    }
    res.json({ success: true });
  });

  app.post("/api/hubRecords/reset", (req, res) => {
    db.hubRecords = HUB_RECORDS.map(r => ({ ...r }));
    res.json({ success: true, records: db.hubRecords });
  });

  // === Team Leader Notes ===
  app.get("/api/teamLeaderNotes", (req, res) => {
    res.json(db.teamLeaderNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  });

  app.post("/api/teamLeaderNotes", (req, res) => {
    const item = { ...req.body };
    db.teamLeaderNotes.push(item);
    res.json(item);
  });

  app.put("/api/teamLeaderNotes/:id", (req, res) => {
    const idx = db.teamLeaderNotes.findIndex(i => i.id === req.params.id);
    if (idx !== -1) {
      db.teamLeaderNotes[idx] = { ...db.teamLeaderNotes[idx], ...req.body };
      res.json(db.teamLeaderNotes[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/teamLeaderNotes/:id", (req, res) => {
    db.teamLeaderNotes = db.teamLeaderNotes.filter(i => i.id !== req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/teamLeaderNotes", (req, res) => {
    db.teamLeaderNotes = [];
    res.json({ success: true });
  });

  // === Customer Contacts ===
  app.get("/api/customerContacts", (req, res) => {
    res.json(db.customerContacts);
  });

  app.post("/api/customerContacts", (req, res) => {
    const item = { ...req.body };
    db.customerContacts.push(item);
    res.json(item);
  });

  app.put("/api/customerContacts/:id", (req, res) => {
    const idx = db.customerContacts.findIndex(i => i.id === req.params.id);
    if (idx !== -1) {
      db.customerContacts[idx] = { ...db.customerContacts[idx], ...req.body };
      res.json(db.customerContacts[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/customerContacts/:id", (req, res) => {
    db.customerContacts = db.customerContacts.filter(i => i.id !== req.params.id);
    res.json({ success: true });
  });

  // === Team Leaders ===
  app.get("/api/teamLeaders", (req, res) => {
    res.json(db.teamLeaders);
  });

  app.post("/api/teamLeaders", (req, res) => {
    const item = { ...req.body };
    db.teamLeaders.push(item);
    res.json(item);
  });

  app.put("/api/teamLeaders/:id", (req, res) => {
    const idx = db.teamLeaders.findIndex(i => i.id === req.params.id);
    if (idx !== -1) {
      db.teamLeaders[idx] = { ...db.teamLeaders[idx], ...req.body };
      res.json(db.teamLeaders[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/teamLeaders/:id", (req, res) => {
    db.teamLeaders = db.teamLeaders.filter(i => i.id !== req.params.id);
    res.json({ success: true });
  });

  // === Feedbacks ===
  app.post("/api/feedbacks", (req, res) => {
    const item = { ...req.body };
    db.feedbacks.push(item);
    res.json(item);
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
