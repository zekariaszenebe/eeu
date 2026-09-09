import { FeederInterruption, SystemNotification, InterruptionStatus, InterruptionType, TeamLeaderNote, ContactItem, TeamLeaderUser } from '../types';
import { INITIAL_FEEDERS_LIST, INITIAL_CUSTOMER_CONTACTS } from '../data/mockData';
import { FEEDERS_VERSION } from '../data/feedersList';
import { HubRecord, HUB_RECORDS } from '../data/hubData';
import { supabase, isSupabaseConfigured } from './supabase';

export const DEFAULT_TEAM_LEADERS: TeamLeaderUser[] = [
  { id: 'admin-1', username: 'admin', password: '@Eeu1234', name: 'System Administrator', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() },
  { id: 'agent-1', username: 'contactcenter', password: '@Eeu1234', name: 'Contact Center Agent', district: 'Team A', role: 'agent', createdAt: new Date().toISOString() },
  { id: 'tl-1', username: 'teamleader', password: '@Eeu1234', name: 'Team Leader', district: 'Team D', role: 'team_leader', createdAt: new Date().toISOString() },
  { id: 'tl-d', username: 'zz01641821', password: 'eeu1234', name: 'Zekarias Zenebe', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() }
];

// Helper to notify UI if RLS policy needs enabling
function notifyIfRlsError(table: string, error: any) {
  if (!error) return;
  console.warn(`[Supabase ${table} Error]:`, error);
  const msg = (error.message || '').toLowerCase();
  if (
    error.code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('violates row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('rls')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabase-rls-notice', {
        detail: { table, message: error.message }
      }));
    }
  }
}

// Polyfill for API requests
async function fetchApi(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON but received ${contentType || 'non-json content'}`);
    }
    return await res.json();
  } catch (err) {
    throw err;
  }
}

// Local storage persistent fallback helpers
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

export async function seedInitialDataIfEmpty() {
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

  // Pre-seed Supabase team leaders if table is empty
  if (isSupabaseConfigured) {
    try {
      const { data: existingTL, error } = await supabase.from('teamLeaders').select('id').limit(1);
      if (!error && (!existingTL || existingTL.length === 0)) {
        await supabase.from('teamLeaders').insert(DEFAULT_TEAM_LEADERS);
      }
    } catch {
      // ignore
    }
  }

  const SEED_STORAGE_KEY = 'eeu-local-seeded-v7';
  if (typeof window !== 'undefined' && localStorage.getItem(SEED_STORAGE_KEY)) {
    return;
  }

  try {
    const presetRes = await fetchApi('/api/presetFeeders');
    if (presetRes.length === 0) {
      await fetchApi('/api/presetFeeders/bulk', { method: 'POST', body: JSON.stringify({ feeders: INITIAL_FEEDERS_LIST }) });
    }
    
    const hubRes = await fetchApi('/api/hubRecords');
    if (hubRes.length === 0) {
      await fetchApi('/api/hubRecords/bulk', { method: 'POST', body: JSON.stringify({ records: HUB_RECORDS }) });
    }

    const teamLeadersRes = await fetchApi('/api/teamLeaders');
    if (teamLeadersRes.length === 0) {
      for (const tl of DEFAULT_TEAM_LEADERS) {
        await fetchApi('/api/teamLeaders', { method: 'POST', body: JSON.stringify(tl) });
      }
    }
  } catch {
    // Silently ignore if running on static Cloudflare Pages
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SEED_STORAGE_KEY, 'true');
  }
}

// ==========================================
// 1. FEEDER INTERRUPTIONS (SUPABASE + REALTIME)
// ==========================================

export function subscribeToInterruptions(onUpdate: (items: FeederInterruption[]) => void) {
  // 1. Immediately emit cached data for instant render
  const cached = getLocal<FeederInterruption[]>('eeu-interruptions', []);
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  const fetchSupabase = async () => {
    if (!isSupabaseConfigured) return false;
    try {
      const { data, error } = await supabase
        .from('interruptions')
        .select('*');

      if (!error && Array.isArray(data)) {
        onUpdate(data);
        setLocal('eeu-interruptions', data);
        return true;
      }
      if (error) {
        notifyIfRlsError('interruptions', error);
      }
    } catch (err) {
      console.warn('Supabase fetch error for interruptions:', err);
    }
    return false;
  };

  const fetchFallback = () => {
    fetchApi('/api/interruptions')
      .then(data => {
        if (Array.isArray(data)) {
          onUpdate(data);
          setLocal('eeu-interruptions', data);
        }
      })
      .catch(() => {
        onUpdate(getLocal('eeu-interruptions', []));
      });
  };

  // Initial load
  fetchSupabase().then(success => {
    if (!success) fetchFallback();
  });

  // Setup Supabase Realtime channel with unique instance topic to prevent reuse collisions
  let channel: any = null;
  if (isSupabaseConfigured) {
    try {
      const channelId = `realtime-interruptions-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interruptions' },
          () => {
            fetchSupabase();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed for interruptions, using polling:', err);
    }
  }

  // Periodic polling fallback every 6 seconds to ensure cross-tab & cross-device freshness
  const interval = setInterval(() => {
    fetchSupabase().then(success => {
      if (!success) fetchFallback();
    });
  }, 6000);

  return () => {
    clearInterval(interval);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch {}
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

  // 2. Save directly to Supabase
  if (isSupabaseConfigured) {
    const { error: insErr } = await supabase.from('interruptions').insert(record);
    if (insErr) {
      notifyIfRlsError('interruptions', insErr);
      throw new Error(insErr.message || 'Supabase write rejected by Row-Level Security');
    }

    const { error: notiErr } = await supabase.from('notifications').insert(newNoti);
    if (notiErr) {
      notifyIfRlsError('notifications', notiErr);
    }
  }

  // 3. Background sync to local Express server if running (only when Supabase not configured)
  if (!isSupabaseConfigured) {
    try {
      await fetchApi('/api/interruptions', { method: 'POST', body: JSON.stringify(record) });
      await fetchApi('/api/notifications', { method: 'POST', body: JSON.stringify(newNoti) });
    } catch {
      // Expected on static hosting
    }
  }

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

  let changeNoti: SystemNotification | null = null;
  if (entry.status && existingRecord?.status && entry.status !== existingRecord.status) {
    const typeVal = entry.status === InterruptionStatus.RESTORED ? 'resolve' : 'update';
    const titleText = entry.status === InterruptionStatus.RESTORED ? 'Feeder Line Restored' : 'Operational Status Changed';
    const messageText = entry.status === InterruptionStatus.RESTORED 
      ? `${merged.feederName} restored to active grid status and re-energized successfully.`
      : `${merged.feederName} reassessed as ${entry.status}. Details: ${entry.remark || merged.remark}`;

    const notiId = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    changeNoti = {
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

  // 2. Update Supabase with clean explicit columns
  if (isSupabaseConfigured) {
    const updatePayload: Record<string, any> = {
      lastUpdated: timestampStr
    };
    if (entry.status !== undefined) updatePayload.status = entry.status;
    if (entry.remark !== undefined) updatePayload.remark = entry.remark;
    if (entry.estimatedRestorationTime !== undefined) updatePayload.estimatedRestorationTime = entry.estimatedRestorationTime;
    if (entry.feederName !== undefined) updatePayload.feederName = entry.feederName;
    if (entry.district !== undefined) updatePayload.district = entry.district;
    if (entry.type !== undefined) updatePayload.type = entry.type;
    if (entry.startTime !== undefined) updatePayload.startTime = entry.startTime;
    if (entry.affectedArea !== undefined) updatePayload.affectedArea = entry.affectedArea;

    const { error: updErr } = await supabase.from('interruptions').update(updatePayload).eq('id', id);
    if (updErr) {
      notifyIfRlsError('interruptions', updErr);
      throw new Error(updErr.message || 'Supabase update rejected by Row-Level Security');
    }

    if (changeNoti) {
      // Fire-and-forget notification insertion so it never blocks UI responsiveness
      (async () => {
        try {
          const { error: notiErr } = await supabase.from('notifications').insert(changeNoti);
          if (notiErr) {
            notifyIfRlsError('notifications', notiErr);
          }
        } catch {
          // Ignore background failures
        }
      })();
    }
  }

  // 3. Fallback to Express backend ONLY if Supabase is not configured
  if (!isSupabaseConfigured) {
    try {
      await fetchApi(`/api/interruptions/${id}`, { method: 'PUT', body: JSON.stringify(merged) });
      if (changeNoti) {
        await fetchApi('/api/notifications', { method: 'POST', body: JSON.stringify(changeNoti) });
      }
    } catch {
      // Expected on static hosting
    }
  }
}

export async function deleteInterruptionDoc(id: string) {
  try {
    const existing = getLocal<FeederInterruption[]>('eeu-interruptions', []);
    setLocal('eeu-interruptions', existing.filter(i => i.id !== id));
  } catch {}

  if (isSupabaseConfigured) {
    const { error } = await supabase.from('interruptions').delete().eq('id', id);
    if (error) {
      notifyIfRlsError('interruptions', error);
      throw new Error(error.message || 'Supabase delete rejected by Row-Level Security');
    }
  }

  if (!isSupabaseConfigured) {
    try {
      await fetchApi(`/api/interruptions/${id}`, { method: 'DELETE' });
    } catch {
      // Expected on static hosting
    }
  }
}

// ==========================================
// 2. NOTIFICATIONS (SUPABASE + REALTIME)
// ==========================================

export function subscribeToNotifications(onUpdate: (items: SystemNotification[]) => void) {
  const cached = getLocal<SystemNotification[]>('eeu-notifications', []);
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  const fetchSupabase = async () => {
    if (!isSupabaseConfigured) return false;
    try {
      const { data, error } = await supabase.from('notifications').select('*');
      if (!error && Array.isArray(data)) {
        onUpdate(data);
        setLocal('eeu-notifications', data);
        return true;
      }
    } catch {}
    return false;
  };

  const fetchFallback = () => {
    fetchApi('/api/notifications')
      .then(data => {
        onUpdate(data);
        setLocal('eeu-notifications', data);
      })
      .catch(() => {
        onUpdate(getLocal('eeu-notifications', []));
      });
  };

  fetchSupabase().then(success => {
    if (!success) fetchFallback();
  });

  let channel: any = null;
  if (isSupabaseConfigured) {
    try {
      const channelId = `realtime-notifications-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          fetchSupabase();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed for notifications, using polling:', err);
    }
  }

  const interval = setInterval(() => {
    fetchSupabase().then(success => {
      if (!success) fetchFallback();
    });
  }, 6000);

  return () => {
    clearInterval(interval);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
  };
}

export async function markAllNotificationsAsReadDoc() {
  try {
    const existing = getLocal<SystemNotification[]>('eeu-notifications', []);
    setLocal('eeu-notifications', existing.map(n => ({ ...n, read: true })));
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase.from('notifications').update({ read: true }).neq('id', '');
    } catch {}
  }

  try {
    await fetchApi('/api/notifications/read-all', { method: 'PUT' });
  } catch {}
}

export async function markOneNotificationAsReadDoc(id: string) {
  try {
    const existing = getLocal<SystemNotification[]>('eeu-notifications', []);
    setLocal('eeu-notifications', existing.map(n => n.id === id ? { ...n, read: true } : n));
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch {}
  }

  try {
    await fetchApi(`/api/notifications/${id}/read`, { method: 'PUT' });
  } catch {}
}

export async function clearAllNotificationsDoc() {
  try {
    setLocal('eeu-notifications', []);
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase.from('notifications').delete().neq('id', '');
    } catch {}
  }

  try {
    await fetchApi('/api/notifications', { method: 'DELETE' });
  } catch {}
}

// ==========================================
// 3. PRESET FEEDERS LIST
// ==========================================

export function subscribeToFeedersList(onUpdate: (items: string[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/presetFeeders').then(data => {
      const merged = Array.from(new Set([...INITIAL_FEEDERS_LIST, ...data])).sort();
      onUpdate(merged);
      setLocal('eeu-feeders-list-v4', merged);
    }).catch(() => {
      onUpdate(getLocal('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 10000);
  return () => clearInterval(interval);
}

export async function addPresetFeederDoc(feederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    setLocal('eeu-feeders-list-v4', Array.from(new Set([...existing, feederStr])).sort());
  } catch {}
  try {
    await fetchApi('/api/presetFeeders', { method: 'POST', body: JSON.stringify({ id: `feeder-${Date.now()}`, feederStr }) });
  } catch {}
}

export async function deletePresetFeederDoc(feederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    setLocal('eeu-feeders-list-v4', existing.filter(f => f !== feederStr));
  } catch {}
  try {
    await fetchApi(`/api/presetFeeders/${encodeURIComponent(feederStr)}`, { method: 'DELETE' });
  } catch {}
}

export async function updatePresetFeederDoc(oldFeederStr: string, newFeederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    setLocal('eeu-feeders-list-v4', existing.map(f => f === oldFeederStr ? newFeederStr : f));
  } catch {}
  try {
    await fetchApi('/api/presetFeeders', { method: 'PUT', body: JSON.stringify({ oldFeederStr, newFeederStr }) });
  } catch {}
}

export async function resetAllPresetFeedersToMaster() {
  try {
    setLocal('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
  } catch {}
  try {
    await fetchApi('/api/presetFeeders/bulk', { method: 'POST', body: JSON.stringify({ feeders: INITIAL_FEEDERS_LIST }) });
  } catch {}
}

// ==========================================
// 4. HUB RECORDS
// ==========================================

export function subscribeToHubRecords(onUpdate: (items: HubRecord[]) => void) {
  const mergeRecords = (incoming: HubRecord[] | null | undefined): HubRecord[] => {
    const baseMap = new Map<number, HubRecord>();
    HUB_RECORDS.forEach(r => baseMap.set(r.no, { ...r }));
    if (Array.isArray(incoming)) {
      incoming.forEach(r => {
        if (r && typeof r.no === 'number') {
          const existing = baseMap.get(r.no);
          baseMap.set(r.no, existing ? { ...existing, ...r } : r);
        }
      });
    }
    return Array.from(baseMap.values()).sort((a, b) => (a.no || 0) - (b.no || 0));
  };

  const fetchItems = () => {
    fetchApi('/api/hubRecords').then(data => {
      const merged = mergeRecords(data);
      onUpdate(merged);
      setLocal('eeu-hub-records', merged);
    }).catch(() => {
      onUpdate(getLocal<HubRecord[]>('eeu-hub-records', HUB_RECORDS));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 10000);
  return () => clearInterval(interval);
}

export async function updateHubRecordDoc(record: HubRecord) {
  try {
    const stored = getLocal<HubRecord[]>('eeu-hub-records', HUB_RECORDS);
    const updated = stored.map(item => item.no === record.no ? { ...item, ...record } : item);
    setLocal('eeu-hub-records', updated);
  } catch {}
  try {
    await fetchApi(`/api/hubRecords/${record.no}`, { method: 'PUT', body: JSON.stringify(record) });
  } catch {}
}

export async function resetHubRecordsToDefaultDoc() {
  setLocal('eeu-hub-records', HUB_RECORDS);
  try {
    await fetchApi('/api/hubRecords/reset', { method: 'POST' });
  } catch {}
}

// ==========================================
// 5. TEAM LEADER NOTES (SUPABASE + REALTIME)
// ==========================================

export function subscribeToTeamLeaderNotes(onUpdate: (items: TeamLeaderNote[]) => void) {
  const cached = getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  const fetchSupabase = async () => {
    if (!isSupabaseConfigured) return false;
    try {
      const { data, error } = await supabase.from('teamLeaderNotes').select('*');
      if (!error && Array.isArray(data)) {
        onUpdate(data);
        setLocal('eeu-team-leader-notes', data);
        return true;
      }
    } catch {}
    return false;
  };

  const fetchFallback = () => {
    fetchApi('/api/teamLeaderNotes')
      .then(data => {
        onUpdate(data);
        setLocal('eeu-team-leader-notes', data);
      })
      .catch(() => {
        onUpdate(getLocal('eeu-team-leader-notes', []));
      });
  };

  fetchSupabase().then(success => {
    if (!success) fetchFallback();
  });

  let channel: any = null;
  if (isSupabaseConfigured) {
    try {
      const channelId = `realtime-notes-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teamLeaderNotes' }, () => {
          fetchSupabase();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed for teamLeaderNotes, using polling:', err);
    }
  }

  const interval = setInterval(() => {
    fetchSupabase().then(success => {
      if (!success) fetchFallback();
    });
  }, 6000);

  return () => {
    clearInterval(interval);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
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

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('teamLeaderNotes').insert(record);
      notifyIfRlsError('teamLeaderNotes', error);
    } catch (e) {
      console.error('Supabase note insert error:', e);
    }
  }

  try {
    await fetchApi('/api/teamLeaderNotes', { method: 'POST', body: JSON.stringify(record) });
  } catch {}

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

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('teamLeaderNotes').update({ content, isUrgent, timestamp: timestampStr }).eq('id', id);
      notifyIfRlsError('teamLeaderNotes', error);
    } catch (e) {
      console.error('Supabase note update error:', e);
    }
  }

  try {
    await fetchApi(`/api/teamLeaderNotes/${id}`, { method: 'PUT', body: JSON.stringify({ content, isUrgent, timestamp: timestampStr }) });
  } catch {}
}

export async function deleteTeamLeaderNoteDoc(id: string) {
  try {
    const existing = getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
    setLocal('eeu-team-leader-notes', existing.filter(n => n.id !== id));
  } catch {}

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('teamLeaderNotes').delete().eq('id', id);
      notifyIfRlsError('teamLeaderNotes', error);
    } catch (e) {
      console.error('Supabase note delete error:', e);
    }
  }

  try {
    await fetchApi(`/api/teamLeaderNotes/${id}`, { method: 'DELETE' });
  } catch {}
}

export async function clearTeamLeaderNotes() {
  try {
    setLocal('eeu-team-leader-notes', []);
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase.from('teamLeaderNotes').delete().neq('id', '');
    } catch {}
  }

  try {
    await fetchApi('/api/teamLeaderNotes', { method: 'DELETE' });
  } catch {}
}

// ==========================================
// 6. CUSTOMER CONTACTS
// ==========================================

export function subscribeToCustomerContacts(onUpdate: (items: ContactItem[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/customerContacts').then(data => {
      data.sort((a: any, b: any) => {
        const catOrder: any = { 'head_regional': 0, 'sheger_city': 1, 'regional_hotline': 2 };
        const aOrder = catOrder[a.category] ?? 3;
        const bOrder = catOrder[b.category] ?? 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      });
      onUpdate(data);
      setLocal('eeu-customer-contacts', data);
    }).catch(() => {
      onUpdate(getLocal('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 10000);
  return () => clearInterval(interval);
}

export async function addCustomerContactDoc(item: Omit<ContactItem, 'id'>) {
  const newId = `cc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record: ContactItem = { ...item, id: newId };
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', [...existing, record]);
  } catch {}
  try {
    await fetchApi('/api/customerContacts', { method: 'POST', body: JSON.stringify(record) });
  } catch {}
  return record;
}

export async function updateCustomerContactDoc(item: ContactItem) {
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', existing.map(c => c.id === item.id ? item : c));
  } catch {}
  try {
    await fetchApi(`/api/customerContacts/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
  } catch {}
}

export async function deleteCustomerContactDoc(id: string) {
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', existing.filter(c => c.id !== id));
  } catch {}
  try {
    await fetchApi(`/api/customerContacts/${id}`, { method: 'DELETE' });
  } catch {}
}

// ==========================================
// 7. TEAM LEADERS & USERS (SUPABASE + REALTIME)
// ==========================================

export function subscribeToTeamLeaders(onUpdate: (items: TeamLeaderUser[]) => void) {
  const getInitial = (): TeamLeaderUser[] => {
    const stored = getLocal<TeamLeaderUser[]>('eeu-team-leaders', []);
    if (!stored || stored.length === 0) {
      setLocal('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
      return DEFAULT_TEAM_LEADERS;
    }
    return stored;
  };

  // Immediate cached render
  const initial = getInitial();
  onUpdate(initial);

  const fetchSupabase = async () => {
    if (!isSupabaseConfigured) return false;
    try {
      const { data, error } = await supabase.from('teamLeaders').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        onUpdate(data);
        setLocal('eeu-team-leaders', data);
        return true;
      }
      if (error) {
        notifyIfRlsError('teamLeaders', error);
      }
    } catch {}
    return false;
  };

  const fetchFallback = () => {
    fetchApi('/api/teamLeaders').then(data => {
      if (Array.isArray(data) && data.length > 0) {
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        onUpdate(data);
        setLocal('eeu-team-leaders', data);
      } else {
        const fallback = getInitial();
        fallback.sort((a, b) => a.name.localeCompare(b.name));
        onUpdate(fallback);
      }
    }).catch(() => {
      const fallback = getInitial();
      fallback.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(fallback);
    });
  };

  fetchSupabase().then(success => {
    if (!success) fetchFallback();
  });

  let channel: any = null;
  if (isSupabaseConfigured) {
    try {
      const channelId = `realtime-teamleaders-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teamLeaders' }, () => {
          fetchSupabase();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed for teamLeaders, using polling:', err);
    }
  }

  const interval = setInterval(() => {
    fetchSupabase().then(success => {
      if (!success) fetchFallback();
    });
  }, 6000);

  return () => {
    clearInterval(interval);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
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

  // 1. Local storage immediate save
  try {
    const existing = getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    const updated = [...existing.filter(tl => tl.id !== record.id), record];
    setLocal('eeu-team-leaders', updated);
  } catch (err) {
    console.error('Failed to save team leader to localStorage:', err);
  }

  // 2. Supabase save
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('teamLeaders').insert(record);
      notifyIfRlsError('teamLeaders', error);
    } catch (e) {
      console.error('Supabase teamLeader insert error:', e);
    }
  }

  // 3. Backend API sync
  try {
    await fetchApi('/api/teamLeaders', { method: 'POST', body: JSON.stringify(record) });
  } catch {}

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

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('teamLeaders').update(record).eq('id', item.id);
      notifyIfRlsError('teamLeaders', error);
    } catch (e) {
      console.error('Supabase teamLeader update error:', e);
    }
  }

  try {
    await fetchApi(`/api/teamLeaders/${item.id}`, { method: 'PUT', body: JSON.stringify(record) });
  } catch {}
}

export async function deleteTeamLeaderDoc(id: string) {
  try {
    const existing = getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    const updated = existing.filter(tl => tl.id !== id);
    setLocal('eeu-team-leaders', updated);
  } catch (err) {
    console.error('Failed to delete team leader from localStorage:', err);
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('teamLeaders').delete().eq('id', id);
      notifyIfRlsError('teamLeaders', error);
    } catch (e) {
      console.error('Supabase teamLeader delete error:', e);
    }
  }

  try {
    await fetchApi(`/api/teamLeaders/${id}`, { method: 'DELETE' });
  } catch {}
}

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
    await fetchApi('/api/feedbacks', { method: 'POST', body: JSON.stringify(record) });
  } catch {}
  return record;
}
