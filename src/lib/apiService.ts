import { FeederInterruption, SystemNotification, InterruptionStatus, InterruptionType, TeamLeaderNote, ContactItem, TeamLeaderUser } from '../types';
import { INITIAL_FEEDERS_LIST, INITIAL_CUSTOMER_CONTACTS } from '../data/mockData';
import { HubRecord, HUB_RECORDS } from '../data/hubData';

export const DEFAULT_TEAM_LEADERS: TeamLeaderUser[] = [
  { id: 'admin-1', username: 'admin', password: '@Eeu1234', name: 'System Administrator', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() },
  { id: 'agent-1', username: 'contactcenter', password: '@Eeu1234', name: 'Contact Center Agent', district: 'Team A', role: 'agent', createdAt: new Date().toISOString() },
  { id: 'tl-1', username: 'teamleader', password: '@Eeu1234', name: 'Team Leader', district: 'Team D', role: 'team_leader', createdAt: new Date().toISOString() },
  { id: 'tl-d', username: 'zz01641821', password: 'eeu1234', name: 'Zekarias Zenebe', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() }
];

// Local storage persistent caching helpers
export function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocal<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Base URL for API calls: empty string for same-origin proxy (Render/Node), or custom proxy URL for GitHub Pages
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('eeu-api-proxy-url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  }
  const envUrl = (import.meta.env.VITE_API_PROXY_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return '';
}

export function setApiProxyUrl(url: string) {
  if (typeof window !== 'undefined') {
    const clean = (url || '').trim().replace(/\/$/, '');
    if (!clean) {
      localStorage.removeItem('eeu-api-proxy-url');
    } else {
      localStorage.setItem('eeu-api-proxy-url', clean);
    }
    // Re-initialize SSE
    if (eventSourceInstance) {
      eventSourceInstance.close();
      eventSourceInstance = null;
    }
    eventSourceInitialized = false;
    initRealtimeEvents();
  }
}

export function isGitHubPagesDeployment(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('github.io') || window.location.hostname.includes('github.io');
}

export async function testProxyConnection(urlCandidate?: string): Promise<{ ok: boolean; message: string; mode?: string }> {
  const target = (urlCandidate !== undefined ? urlCandidate.trim().replace(/\/$/, '') : getApiBaseUrl());
  try {
    const res = await fetch(`${target}/api/proxy-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      return { ok: false, message: `Server returned HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, message: 'Connected successfully to backend proxy!', mode: data?.mode || 'proxy' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to reach server' };
  }
}

export const API_BASE_URL = getApiBaseUrl();

// Server API request helper with JSON parsing and fallback error handling
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;
  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      console.warn(`[API Proxy ${options?.method || 'GET'} ${fullUrl} returned ${res.status}]`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`[API Proxy request failed for ${fullUrl}]:`, err?.message);
    return null;
  }
}

// ==========================================
// REAL-TIME SERVER-SENT EVENTS (SSE) ENGINE
// Client connects ONLY to application origin /api/events
// Never connects to supabase.co directly (bypasses IT firewalls!)
// ==========================================
const syncListeners = {
  interruptions: new Set<() => void>(),
  notifications: new Set<() => void>(),
  teamLeaders: new Set<() => void>(),
  teamLeaderNotes: new Set<() => void>(),
  presetFeeders: new Set<() => void>(),
  hubRecords: new Set<() => void>(),
  customerContacts: new Set<() => void>()
};

let eventSourceInitialized = false;
let eventSourceInstance: EventSource | null = null;

function initRealtimeEvents() {
  if (typeof window === 'undefined' || eventSourceInitialized) return;
  eventSourceInitialized = true;

  const connect = () => {
    try {
      if (eventSourceInstance) {
        eventSourceInstance.close();
      }
      const baseUrl = getApiBaseUrl();
      eventSourceInstance = new EventSource(`${baseUrl}/api/events`);

      eventSourceInstance.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const topic = payload?.topic as keyof typeof syncListeners;
          if (topic && syncListeners[topic]) {
            syncListeners[topic].forEach(cb => {
              try { cb(); } catch (err) { console.error('Sync listener error:', err); }
            });
          }
        } catch {
          // ignore heartbeats or non-json
        }
      };

      eventSourceInstance.onerror = () => {
        eventSourceInstance?.close();
        // Reconnect after brief pause
        setTimeout(connect, 4000);
      };
    } catch (e) {
      console.warn('[SSE Connection error]:', e);
      setTimeout(connect, 5000);
    }
  };

  connect();
}

export function broadcastGlobalSync(topic: keyof typeof syncListeners) {
  // Trigger local listeners immediately
  if (syncListeners[topic]) {
    syncListeners[topic].forEach(cb => {
      try { cb(); } catch {}
    });
  }
}

export async function seedInitialDataIfEmpty() {
  initRealtimeEvents();

  if (typeof window !== 'undefined') {
    const localTL = getLocal<TeamLeaderUser[]>('eeu-team-leaders', []);
    if (!localTL || localTL.length === 0) {
      setLocal('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    }
    const localHub = getLocal<HubRecord[]>('eeu-hub-records', []);
    if (!localHub || localHub.length === 0) {
      setLocal('eeu-hub-records', HUB_RECORDS);
    }
    const localContacts = getLocal<ContactItem[]>('eeu-customer-contacts', []);
    if (!localContacts || localContacts.length === 0) {
      setLocal('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    }
    const localFeeders = getLocal<string[]>('eeu-feeders-list-v4', []);
    if (!localFeeders || localFeeders.length === 0) {
      setLocal('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    }
  }

  // Ping server proxy status
  apiRequest('/api/proxy-status').catch(() => {});
}

// ==========================================
// 1. FEEDER INTERRUPTIONS (PROXY + SSE)
// ==========================================

export function subscribeToInterruptions(onUpdate: (items: FeederInterruption[]) => void) {
  initRealtimeEvents();

  // 1. Immediately emit cached data for instant render
  const cached = getLocal<FeederInterruption[]>('eeu-interruptions', []);
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  const fetchInterruptions = async () => {
    const data = await apiRequest<FeederInterruption[]>('/api/interruptions');
    if (data && Array.isArray(data)) {
      onUpdate(data);
      setLocal('eeu-interruptions', data);
      return true;
    }
    return false;
  };

  const fetchFallback = () => {
    onUpdate(getLocal('eeu-interruptions', []));
  };

  // Initial load
  fetchInterruptions().then(success => {
    if (!success) fetchFallback();
  });

  // Listen to SSE updates
  const onSync = () => {
    fetchInterruptions();
  };
  syncListeners.interruptions.add(onSync);

  // Automatic refresh when tab becomes active
  const handleVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchInterruptions();
    }
  };
  const handleFocus = () => {
    fetchInterruptions();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
  }

  // Periodic polling safety net every 4 seconds
  const interval = setInterval(() => {
    fetchInterruptions();
  }, 4000);

  return () => {
    syncListeners.interruptions.delete(onSync);
    clearInterval(interval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    }
  };
}

export async function addInterruptionDoc(entry: Omit<FeederInterruption, 'id' | 'lastUpdated'>, customId?: string) {
  const suffix = Math.random().toString(36).substring(2, 9);
  const newId = customId || `f-${Date.now()}-${suffix}`;
  const timestampStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  const record: FeederInterruption = {
    id: newId,
    feederName: entry.feederName || '',
    district: entry.district || 'Team A',
    direction: entry.direction,
    type: entry.type || InterruptionType.EARTH_FAULT,
    status: entry.status || InterruptionStatus.ACTIVE,
    startTime: entry.startTime || timestampStr,
    estimatedRestorationTime: entry.estimatedRestorationTime || 'N/A',
    affectedArea: entry.affectedArea || '',
    remark: entry.remark || '',
    lastUpdated: timestampStr
  };

  // 1. Update localStorage immediately for instantaneous UI update
  try {
    const existing = getLocal<FeederInterruption[]>('eeu-interruptions', []);
    setLocal('eeu-interruptions', [record, ...existing.filter(i => i.id !== newId)]);
  } catch {}

  const notiId = `n-${Date.now()}-${suffix}`;
  const newNoti: SystemNotification = {
    id: notiId,
    feederId: newId,
    type: 'new',
    title: `New Feeder Added`,
    message: `${entry.feederName} (${entry.district}) logged under ${entry.status}. Affected areas: ${entry.affectedArea}`,
    timestamp: timestampStr,
    read: false
  };

  try {
    const existingNotis = getLocal<SystemNotification[]>('eeu-notifications', []);
    setLocal('eeu-notifications', [newNoti, ...existingNotis]);
  } catch {}

  // 2. Post to server proxy
  await apiRequest<FeederInterruption>('/api/interruptions', {
    method: 'POST',
    body: JSON.stringify(record)
  });

  broadcastGlobalSync('interruptions');
  broadcastGlobalSync('notifications');

  return record;
}

export async function updateInterruptionDoc(id: string, entry: Partial<FeederInterruption>, existingRecord?: FeederInterruption) {
  const timestampStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  const merged = { ...existingRecord, ...entry, lastUpdated: timestampStr };

  // 1. Update localStorage immediately
  try {
    const existing = getLocal<FeederInterruption[]>('eeu-interruptions', []);
    setLocal('eeu-interruptions', existing.map(i => i.id === id ? { ...i, ...merged } : i));
  } catch {}

  if (entry.status && existingRecord?.status && entry.status !== existingRecord.status) {
    const typeVal = entry.status === InterruptionStatus.RESTORED ? 'resolve' : 'update';
    const titleText = entry.status === InterruptionStatus.RESTORED ? 'Feeder Line Restored' : 'Operational Status Changed';
    const messageText = entry.status === InterruptionStatus.RESTORED 
      ? `${merged.feederName} restored to active grid status and re-energized successfully.`
      : `${merged.feederName} reassessed as ${entry.status}. Details: ${entry.remark || merged.remark}`;

    const notiId = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const changeNoti: SystemNotification = {
      id: notiId,
      feederId: id,
      type: typeVal,
      title: titleText,
      message: messageText,
      timestamp: timestampStr,
      read: false
    };

    try {
      const existingNotis = getLocal<SystemNotification[]>('eeu-notifications', []);
      setLocal('eeu-notifications', [changeNoti, ...existingNotis]);
    } catch {}
  }

  // 2. Send update to server proxy
  await apiRequest(`/api/interruptions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...entry, lastUpdated: timestampStr })
  });

  broadcastGlobalSync('interruptions');
  broadcastGlobalSync('notifications');
}

export async function deleteInterruptionDoc(id: string) {
  try {
    const existing = getLocal<FeederInterruption[]>('eeu-interruptions', []);
    setLocal('eeu-interruptions', existing.filter(i => i.id !== id));
  } catch {}

  await apiRequest(`/api/interruptions/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  broadcastGlobalSync('interruptions');
}

// ==========================================
// 2. NOTIFICATIONS (PROXY + SSE)
// ==========================================

export function subscribeToNotifications(onUpdate: (items: SystemNotification[]) => void) {
  initRealtimeEvents();

  const cached = getLocal<SystemNotification[]>('eeu-notifications', []);
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  const fetchNotifications = async () => {
    const data = await apiRequest<SystemNotification[]>('/api/notifications');
    if (data && Array.isArray(data)) {
      onUpdate(data);
      setLocal('eeu-notifications', data);
      return true;
    }
    return false;
  };

  const fetchFallback = () => {
    onUpdate(getLocal('eeu-notifications', []));
  };

  fetchNotifications().then(success => {
    if (!success) fetchFallback();
  });

  const onSync = () => {
    fetchNotifications();
  };
  syncListeners.notifications.add(onSync);

  const handleVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchNotifications();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', handleVisibility);
  }

  const interval = setInterval(() => {
    fetchNotifications();
  }, 4500);

  return () => {
    syncListeners.notifications.delete(onSync);
    clearInterval(interval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', handleVisibility);
    }
  };
}

export async function markAllNotificationsAsReadDoc() {
  try {
    const existing = getLocal<SystemNotification[]>('eeu-notifications', []);
    setLocal('eeu-notifications', existing.map(n => ({ ...n, read: true })));
  } catch {}

  await apiRequest('/api/notifications/read-all', { method: 'PUT' });
  broadcastGlobalSync('notifications');
}

export async function markOneNotificationAsReadDoc(id: string) {
  try {
    const existing = getLocal<SystemNotification[]>('eeu-notifications', []);
    setLocal('eeu-notifications', existing.map(n => n.id === id ? { ...n, read: true } : n));
  } catch {}

  await apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });
  broadcastGlobalSync('notifications');
}

export async function clearAllNotificationsDoc() {
  try {
    setLocal('eeu-notifications', []);
  } catch {}

  await apiRequest('/api/notifications', { method: 'DELETE' });
  broadcastGlobalSync('notifications');
}

// ==========================================
// 3. PRESET FEEDERS LIST (PROXY + SYNC)
// ==========================================

export function subscribeToFeedersList(onUpdate: (items: string[]) => void) {
  initRealtimeEvents();

  const loadLocal = () => {
    const data = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    onUpdate(data);
  };
  loadLocal();

  const fetchFeeders = async () => {
    const data = await apiRequest<string[]>('/api/presetFeeders');
    if (data && Array.isArray(data) && data.length > 0) {
      setLocal('eeu-feeders-list-v4', data);
      onUpdate(data);
    }
  };

  fetchFeeders();

  const onSync = () => fetchFeeders();
  syncListeners.presetFeeders.add(onSync);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'eeu-feeders-list-v4') loadLocal();
  };
  const handleCustom = () => loadLocal();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('eeu-feeders-updated', handleCustom);
  }

  return () => {
    syncListeners.presetFeeders.delete(onSync);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('eeu-feeders-updated', handleCustom);
    }
  };
}

export async function addPresetFeederDoc(feederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    const updated = Array.from(new Set([...existing, feederStr])).sort();
    setLocal('eeu-feeders-list-v4', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-feeders-updated'));
    }
  } catch {}

  await apiRequest('/api/presetFeeders', {
    method: 'POST',
    body: JSON.stringify({ feederStr })
  });
}

export async function deletePresetFeederDoc(feederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    const updated = existing.filter(f => f !== feederStr);
    setLocal('eeu-feeders-list-v4', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-feeders-updated'));
    }
  } catch {}

  await apiRequest(`/api/presetFeeders/${encodeURIComponent(feederStr)}`, {
    method: 'DELETE'
  });
}

export async function updatePresetFeederDoc(oldFeederStr: string, newFeederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    const updated = existing.map(f => f === oldFeederStr ? newFeederStr : f);
    setLocal('eeu-feeders-list-v4', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-feeders-updated'));
    }
  } catch {}

  await apiRequest('/api/presetFeeders', {
    method: 'PUT',
    body: JSON.stringify({ oldFeederStr, newFeederStr })
  });
}

export async function resetAllPresetFeedersToMaster() {
  try {
    setLocal('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-feeders-updated'));
    }
  } catch {}

  await apiRequest('/api/presetFeeders/bulk', {
    method: 'POST',
    body: JSON.stringify({ feeders: INITIAL_FEEDERS_LIST })
  });
}

// ==========================================
// 4. HUB RECORDS (PROXY + SYNC)
// ==========================================

export function subscribeToHubRecords(onUpdate: (items: HubRecord[]) => void) {
  initRealtimeEvents();

  const loadLocal = () => {
    const stored = getLocal<HubRecord[]>('eeu-hub-records', HUB_RECORDS);
    const baseMap = new Map<number, HubRecord>();
    HUB_RECORDS.forEach(r => baseMap.set(r.no, { ...r }));
    if (Array.isArray(stored)) {
      stored.forEach(r => {
        if (r && typeof r.no === 'number') {
          const existing = baseMap.get(r.no);
          baseMap.set(r.no, existing ? { ...existing, ...r } : r);
        }
      });
    }
    const merged = Array.from(baseMap.values()).sort((a, b) => (a.no || 0) - (b.no || 0));
    onUpdate(merged);
  };

  loadLocal();

  const fetchHubRecords = async () => {
    const data = await apiRequest<HubRecord[]>('/api/hubRecords');
    if (data && Array.isArray(data) && data.length > 0) {
      setLocal('eeu-hub-records', data);
      onUpdate(data);
    }
  };

  fetchHubRecords();

  const onSync = () => fetchHubRecords();
  syncListeners.hubRecords.add(onSync);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'eeu-hub-records') loadLocal();
  };
  const handleCustom = () => loadLocal();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('eeu-hub-records-updated', handleCustom);
  }

  return () => {
    syncListeners.hubRecords.delete(onSync);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('eeu-hub-records-updated', handleCustom);
    }
  };
}

export async function updateHubRecordDoc(record: HubRecord) {
  try {
    const stored = getLocal<HubRecord[]>('eeu-hub-records', HUB_RECORDS);
    const updated = stored.map(item => item.no === record.no ? { ...item, ...record } : item);
    setLocal('eeu-hub-records', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-hub-records-updated'));
    }
  } catch {}

  await apiRequest(`/api/hubRecords/${record.no}`, {
    method: 'PUT',
    body: JSON.stringify(record)
  });
}

export async function resetHubRecordsToDefaultDoc() {
  setLocal('eeu-hub-records', HUB_RECORDS);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eeu-hub-records-updated'));
  }

  await apiRequest('/api/hubRecords/reset', { method: 'POST' });
}

// ==========================================
// 5. TEAM LEADER NOTES (PROXY + SSE)
// ==========================================

export function subscribeToTeamLeaderNotes(onUpdate: (items: TeamLeaderNote[]) => void) {
  initRealtimeEvents();

  const cached = getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  const fetchNotes = async () => {
    const data = await apiRequest<TeamLeaderNote[]>('/api/teamLeaderNotes');
    if (data && Array.isArray(data)) {
      onUpdate(data);
      setLocal('eeu-team-leader-notes', data);
      return true;
    }
    return false;
  };

  const fetchFallback = () => {
    onUpdate(getLocal('eeu-team-leader-notes', []));
  };

  fetchNotes().then(success => {
    if (!success) fetchFallback();
  });

  const onSync = () => fetchNotes();
  syncListeners.teamLeaderNotes.add(onSync);

  const interval = setInterval(() => {
    fetchNotes();
  }, 4500);

  return () => {
    syncListeners.teamLeaderNotes.delete(onSync);
    clearInterval(interval);
  };
}

export async function addTeamLeaderNoteDoc(content: string, author: string, isUrgent: boolean) {
  const cleanId = 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const timestampStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  const record: TeamLeaderNote = { id: cleanId, content, author: author || "Team Leader", timestamp: timestampStr, isUrgent };
  try {
    const existing = getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
    setLocal('eeu-team-leader-notes', [record, ...existing]);
  } catch {}

  await apiRequest('/api/teamLeaderNotes', {
    method: 'POST',
    body: JSON.stringify(record)
  });

  broadcastGlobalSync('teamLeaderNotes');
  return record;
}

export async function updateTeamLeaderNoteDoc(id: string, content: string, isUrgent: boolean) {
  const timestampStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });
  try {
    const existing = getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
    setLocal('eeu-team-leader-notes', existing.map(n => n.id === id ? { ...n, content, isUrgent, timestamp: timestampStr } : n));
  } catch {}

  await apiRequest(`/api/teamLeaderNotes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ content, isUrgent, timestamp: timestampStr })
  });

  broadcastGlobalSync('teamLeaderNotes');
}

export async function deleteTeamLeaderNoteDoc(id: string) {
  try {
    const existing = getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
    setLocal('eeu-team-leader-notes', existing.filter(n => n.id !== id));
  } catch {}

  await apiRequest(`/api/teamLeaderNotes/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  broadcastGlobalSync('teamLeaderNotes');
}

export async function clearTeamLeaderNotes() {
  try {
    setLocal('eeu-team-leader-notes', []);
  } catch {}

  await apiRequest('/api/teamLeaderNotes', { method: 'DELETE' });
  broadcastGlobalSync('teamLeaderNotes');
}

// ==========================================
// 6. CUSTOMER CONTACTS (PROXY + SYNC)
// ==========================================

export function subscribeToCustomerContacts(onUpdate: (items: ContactItem[]) => void) {
  initRealtimeEvents();

  const loadLocal = () => {
    const data = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    data.sort((a: any, b: any) => {
      const catOrder: any = { 'head_regional': 0, 'sheger_city': 1, 'regional_hotline': 2 };
      const aOrder = catOrder[a.category] ?? 3;
      const bOrder = catOrder[b.category] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });
    onUpdate(data);
  };

  loadLocal();

  const fetchContacts = async () => {
    const data = await apiRequest<ContactItem[]>('/api/customerContacts');
    if (data && Array.isArray(data) && data.length > 0) {
      setLocal('eeu-customer-contacts', data);
      loadLocal();
    }
  };

  fetchContacts();

  const onSync = () => fetchContacts();
  syncListeners.customerContacts.add(onSync);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'eeu-customer-contacts') loadLocal();
  };
  const handleCustom = () => loadLocal();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('eeu-customer-contacts-updated', handleCustom);
  }

  return () => {
    syncListeners.customerContacts.delete(onSync);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('eeu-customer-contacts-updated', handleCustom);
    }
  };
}

export async function addCustomerContactDoc(item: Omit<ContactItem, 'id'>) {
  const newId = `cc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record: ContactItem = { ...item, id: newId };
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', [...existing, record]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-customer-contacts-updated'));
    }
  } catch {}

  await apiRequest('/api/customerContacts', {
    method: 'POST',
    body: JSON.stringify(record)
  });

  return record;
}

export async function updateCustomerContactDoc(item: ContactItem) {
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', existing.map(c => c.id === item.id ? item : c));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-customer-contacts-updated'));
    }
  } catch {}

  await apiRequest(`/api/customerContacts/${encodeURIComponent(item.id)}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });
}

export async function deleteCustomerContactDoc(id: string) {
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', existing.filter(c => c.id !== id));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eeu-customer-contacts-updated'));
    }
  } catch {}

  await apiRequest(`/api/customerContacts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// ==========================================
// 7. TEAM LEADERS & USERS (PROXY + SSE)
// ==========================================

export function subscribeToTeamLeaders(onUpdate: (items: TeamLeaderUser[]) => void) {
  initRealtimeEvents();

  const getInitial = (): TeamLeaderUser[] => {
    const stored = getLocal<TeamLeaderUser[]>('eeu-team-leaders', []);
    if (!stored || stored.length === 0) {
      setLocal('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
      return DEFAULT_TEAM_LEADERS;
    }
    return stored;
  };

  const initial = getInitial();
  onUpdate(initial);

  const fetchTeamLeaders = async () => {
    const data = await apiRequest<TeamLeaderUser[]>('/api/teamLeaders');
    if (data && Array.isArray(data) && data.length > 0) {
      data.sort((a: any, b: any) => a.name.localeCompare(b.name));
      onUpdate(data);
      setLocal('eeu-team-leaders', data);
      return true;
    }
    return false;
  };

  const fetchFallback = () => {
    const fallback = getInitial();
    fallback.sort((a, b) => a.name.localeCompare(b.name));
    onUpdate(fallback);
  };

  fetchTeamLeaders().then(success => {
    if (!success) fetchFallback();
  });

  const onSync = () => fetchTeamLeaders();
  syncListeners.teamLeaders.add(onSync);

  const interval = setInterval(() => {
    fetchTeamLeaders();
  }, 4500);

  return () => {
    syncListeners.teamLeaders.delete(onSync);
    clearInterval(interval);
  };
}

export async function addTeamLeaderDoc(item: Omit<TeamLeaderUser, 'id' | 'createdAt'>) {
  const newId = `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record: TeamLeaderUser = {
    id: newId,
    username: item.username.trim(),
    password: item.password.trim(),
    name: item.name.trim(),
    district: item.district || 'Team A',
    role: item.role || 'team_leader',
    createdAt: new Date().toISOString()
  };
  if (typeof item.mustChangePassword === 'boolean') record.mustChangePassword = item.mustChangePassword;

  try {
    const existing = getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    const updated = [...existing.filter(tl => tl.id !== record.id), record];
    setLocal('eeu-team-leaders', updated);
  } catch (err) {
    console.error('Failed to save team leader to localStorage:', err);
  }

  await apiRequest('/api/teamLeaders', {
    method: 'POST',
    body: JSON.stringify(record)
  });

  broadcastGlobalSync('teamLeaders');
  return record;
}

export async function updateTeamLeaderDoc(item: TeamLeaderUser) {
  const record: TeamLeaderUser = {
    id: item.id,
    username: item.username.trim(),
    password: item.password.trim(),
    name: item.name.trim(),
    district: item.district || 'Team A',
    role: item.role || 'team_leader',
    createdAt: item.createdAt || new Date().toISOString()
  };
  if (typeof item.mustChangePassword === 'boolean') record.mustChangePassword = item.mustChangePassword;

  try {
    const existing = getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    const updated = existing.map(tl => tl.id === item.id ? { ...tl, ...record } : tl);
    setLocal('eeu-team-leaders', updated);
  } catch (err) {
    console.error('Failed to update team leader in localStorage:', err);
  }

  await apiRequest(`/api/teamLeaders/${encodeURIComponent(item.id)}`, {
    method: 'PUT',
    body: JSON.stringify(record)
  });

  broadcastGlobalSync('teamLeaders');
}

export async function deleteTeamLeaderDoc(id: string) {
  try {
    const existing = getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    const updated = existing.filter(tl => tl.id !== id);
    setLocal('eeu-team-leaders', updated);
  } catch (err) {
    console.error('Failed to delete team leader from localStorage:', err);
  }

  await apiRequest(`/api/teamLeaders/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  broadcastGlobalSync('teamLeaders');
}

// ==========================================
// 8. FEEDBACKS
// ==========================================

export interface FeedbackRecord {
  id: string;
  rating: number;
  category: string;
  feedbackText: string;
  submittedBy: string;
  targetEmail: string;
  timestamp: string;
}

export async function addFeedbackDoc(feedback: {
  rating: number;
  category: string;
  feedbackText: string;
  submittedBy: string;
  targetEmail: string;
}): Promise<FeedbackRecord> {
  const newId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: FeedbackRecord = {
    id: newId,
    rating: feedback.rating,
    category: feedback.category,
    feedbackText: feedback.feedbackText.trim(),
    submittedBy: feedback.submittedBy.trim(),
    targetEmail: feedback.targetEmail.trim(),
    timestamp: new Date().toISOString()
  };
  try {
    const existing = getLocal<FeedbackRecord[]>('eeu-feedback-records', []);
    setLocal('eeu-feedback-records', [record, ...existing]);
  } catch {}

  await apiRequest('/api/feedbacks', {
    method: 'POST',
    body: JSON.stringify(record)
  });

  return record;
}
