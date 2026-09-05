import { FeederInterruption, SystemNotification, InterruptionStatus, InterruptionType, TeamLeaderNote, ContactItem, TeamLeaderUser } from '../types';
import { INITIAL_FEEDERS_LIST, INITIAL_CUSTOMER_CONTACTS } from '../data/mockData';
import { FEEDERS_VERSION } from '../data/feedersList';
import { HubRecord, HUB_RECORDS } from '../data/hubData';

export const DEFAULT_TEAM_LEADERS: TeamLeaderUser[] = [
  { id: 'admin-1', username: 'admin', password: '@Eeu1234', name: 'System Administrator', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() },
  { id: 'agent-1', username: 'contactcenter', password: '@Eeu1234', name: 'Contact Center Agent', district: 'Team A', role: 'agent', createdAt: new Date().toISOString() },
  { id: 'tl-1', username: 'teamleader', password: '@Eeu1234', name: 'Team Leader', district: 'Team D', role: 'team_leader', createdAt: new Date().toISOString() },
  { id: 'tl-d', username: 'zz01641821', password: 'eeu1234', name: 'Zekarias Zenebe', district: 'Admin', role: 'admin', createdAt: new Date().toISOString() }
];

// Polyfill for API requests
async function fetchApi(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
  // Pre-seed local storage immediately for static hosting environments (like Cloudflare Pages)
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

  const SEED_STORAGE_KEY = 'eeu-local-seeded-v6';
  if (typeof window !== 'undefined' && localStorage.getItem(SEED_STORAGE_KEY)) {
    return;
  }

  // Pre-seed API with defaults if backend server is available
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
  } catch(e) {
     // Silently ignore if running on static Cloudflare Pages where backend server isn't running
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SEED_STORAGE_KEY, 'true');
  }
}

export function subscribeToInterruptions(onUpdate: (items: FeederInterruption[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/interruptions').then(data => {
      onUpdate(data);
      setLocal('eeu-interruptions', data);
    }).catch(e => {
      onUpdate(getLocal('eeu-interruptions', []));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 5000);
  return () => clearInterval(interval);
}

export function subscribeToNotifications(onUpdate: (items: SystemNotification[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/notifications').then(data => {
      onUpdate(data);
      setLocal('eeu-notifications', data);
    }).catch(e => {
      onUpdate(getLocal('eeu-notifications', []));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 5000);
  return () => clearInterval(interval);
}

export function subscribeToFeedersList(onUpdate: (items: string[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/presetFeeders').then(data => {
      const merged = Array.from(new Set([...INITIAL_FEEDERS_LIST, ...data])).sort();
      onUpdate(merged);
      setLocal('eeu-feeders-list-v4', merged);
    }).catch(e => {
      onUpdate(getLocal('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 10000);
  return () => clearInterval(interval);
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

  // Update localStorage immediately
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

  try {
    await fetchApi('/api/interruptions', { method: 'POST', body: JSON.stringify(record) });
    await fetchApi('/api/notifications', { method: 'POST', body: JSON.stringify(newNoti) });
  } catch (e) {
    console.warn('Backend /api/interruptions not available. Saved locally.');
  }

  return record;
}

export async function updateInterruptionDoc(id: string, entry: Partial<FeederInterruption>, existingRecord?: FeederInterruption) {
  const timestampStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  const merged = { ...existingRecord, ...entry, lastUpdated: timestampStr };

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

  try {
    await fetchApi(`/api/interruptions/${id}`, { method: 'PUT', body: JSON.stringify(merged) });
    if (changeNoti) {
      await fetchApi('/api/notifications', { method: 'POST', body: JSON.stringify(changeNoti) });
    }
  } catch (e) {
    console.warn('Backend /api/interruptions not available. Updated locally.');
  }
}

export async function deleteInterruptionDoc(id: string) {
  try {
    const existing = getLocal<FeederInterruption[]>('eeu-interruptions', []);
    setLocal('eeu-interruptions', existing.filter(i => i.id !== id));
  } catch {}

  try {
    await fetchApi(`/api/interruptions/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Backend /api/interruptions not available. Deleted locally.');
  }
}

export async function markAllNotificationsAsReadDoc() {
  try {
    const existing = getLocal<SystemNotification[]>('eeu-notifications', []);
    setLocal('eeu-notifications', existing.map(n => ({ ...n, read: true })));
  } catch {}
  try {
    await fetchApi('/api/notifications/read-all', { method: 'PUT' });
  } catch (e) {}
}

export async function markOneNotificationAsReadDoc(id: string) {
  try {
    const existing = getLocal<SystemNotification[]>('eeu-notifications', []);
    setLocal('eeu-notifications', existing.map(n => n.id === id ? { ...n, read: true } : n));
  } catch {}
  try {
    await fetchApi(`/api/notifications/${id}/read`, { method: 'PUT' });
  } catch (e) {}
}

export async function clearAllNotificationsDoc() {
  try {
    setLocal('eeu-notifications', []);
  } catch {}
  try {
    await fetchApi('/api/notifications', { method: 'DELETE' });
  } catch (e) {}
}

export async function addPresetFeederDoc(feederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    setLocal('eeu-feeders-list-v4', Array.from(new Set([...existing, feederStr])).sort());
  } catch {}
  try {
    await fetchApi('/api/presetFeeders', { method: 'POST', body: JSON.stringify({ id: `feeder-${Date.now()}`, feederStr }) });
  } catch (e) {}
}

export async function deletePresetFeederDoc(feederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    setLocal('eeu-feeders-list-v4', existing.filter(f => f !== feederStr));
  } catch {}
  try {
    await fetchApi(`/api/presetFeeders/${encodeURIComponent(feederStr)}`, { method: 'DELETE' });
  } catch (e) {}
}

export async function updatePresetFeederDoc(oldFeederStr: string, newFeederStr: string) {
  try {
    const existing = getLocal<string[]>('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
    setLocal('eeu-feeders-list-v4', existing.map(f => f === oldFeederStr ? newFeederStr : f));
  } catch {}
  try {
    await fetchApi('/api/presetFeeders', { method: 'PUT', body: JSON.stringify({ oldFeederStr, newFeederStr }) });
  } catch (e) {}
}

export async function resetAllPresetFeedersToMaster() {
  try {
    setLocal('eeu-feeders-list-v4', INITIAL_FEEDERS_LIST);
  } catch {}
  try {
    await fetchApi('/api/presetFeeders/bulk', { method: 'POST', body: JSON.stringify({ feeders: INITIAL_FEEDERS_LIST }) });
  } catch (e) {}
}

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
    }).catch(e => {
      const local = getLocal<HubRecord[]>('eeu-hub-records', HUB_RECORDS);
      const merged = mergeRecords(local);
      onUpdate(merged);
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 8000);
  return () => clearInterval(interval);
}

export async function updateHubRecordDoc(record: HubRecord) {
  // Update local cache first to ensure immediate responsiveness
  try {
    const current = getLocal<HubRecord[]>('eeu-hub-records', HUB_RECORDS);
    const updated = current.map(item => item.no === record.no ? { ...item, ...record } : item);
    setLocal('eeu-hub-records', updated);
  } catch {
    // ignore
  }
  try {
    await fetchApi(`/api/hubRecords/${record.no}`, { method: 'PUT', body: JSON.stringify(record) });
  } catch (e) {
    console.warn('Backend /api/hubRecords not available. Saved locally.');
  }
}

export async function resetHubRecordsToDefaultDoc() {
  setLocal('eeu-hub-records', HUB_RECORDS);
  try {
    await fetchApi('/api/hubRecords/reset', { method: 'POST' });
  } catch (e) {
    console.warn('Backend /api/hubRecords/reset not available.');
  }
}

export function subscribeToTeamLeaderNotes(onUpdate: (items: TeamLeaderNote[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/teamLeaderNotes').then(data => {
      onUpdate(data);
      setLocal('eeu-team-leader-notes', data);
    }).catch(e => {
      onUpdate(getLocal('eeu-team-leader-notes', []));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 5000);
  return () => clearInterval(interval);
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
  try {
    await fetchApi('/api/teamLeaderNotes', { method: 'POST', body: JSON.stringify(record) });
  } catch (e) {
    console.warn('Backend /api/teamLeaderNotes not available. Saved locally.');
  }
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
  try {
    await fetchApi(`/api/teamLeaderNotes/${id}`, { method: 'PUT', body: JSON.stringify({ content, isUrgent, timestamp: timestampStr }) });
  } catch (e) {
    console.warn('Backend /api/teamLeaderNotes not available. Updated locally.');
  }
}

export async function deleteTeamLeaderNoteDoc(id: string) {
  try {
    const existing = getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
    setLocal('eeu-team-leader-notes', existing.filter(n => n.id !== id));
  } catch {}
  try {
    await fetchApi(`/api/teamLeaderNotes/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Backend /api/teamLeaderNotes not available. Deleted locally.');
  }
}

export async function clearTeamLeaderNotes() {
  try {
    setLocal('eeu-team-leader-notes', []);
  } catch {}
  try {
    await fetchApi('/api/teamLeaderNotes', { method: 'DELETE' });
  } catch (e) {
    console.warn('Backend /api/teamLeaderNotes not available. Cleared locally.');
  }
}

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
    }).catch(e => {
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
  } catch (e) {
    console.warn('Backend /api/customerContacts not available. Saved locally.');
  }
  return record;
}

export async function updateCustomerContactDoc(item: ContactItem) {
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', existing.map(c => c.id === item.id ? item : c));
  } catch {}
  try {
    await fetchApi(`/api/customerContacts/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
  } catch (e) {
    console.warn('Backend /api/customerContacts not available. Updated locally.');
  }
}

export async function deleteCustomerContactDoc(id: string) {
  try {
    const existing = getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
    setLocal('eeu-customer-contacts', existing.filter(c => c.id !== id));
  } catch {}
  try {
    await fetchApi(`/api/customerContacts/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Backend /api/customerContacts not available. Deleted locally.');
  }
}

export function subscribeToTeamLeaders(onUpdate: (items: TeamLeaderUser[]) => void) {
  const getInitial = (): TeamLeaderUser[] => {
    const stored = getLocal<TeamLeaderUser[]>('eeu-team-leaders', []);
    if (!stored || stored.length === 0) {
      setLocal('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
      return DEFAULT_TEAM_LEADERS;
    }
    return stored;
  };

  const fetchItems = () => {
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
    }).catch(e => {
      const fallback = getInitial();
      fallback.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(fallback);
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 10000);
  return () => clearInterval(interval);
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

  // Persist directly to localStorage first
  try {
    const existing = getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    const updated = [...existing.filter(tl => tl.id !== record.id), record];
    setLocal('eeu-team-leaders', updated);
  } catch (err) {
    console.error('Failed to save team leader to localStorage:', err);
  }

  // Sync to backend API if available
  try {
    await fetchApi('/api/teamLeaders', { method: 'POST', body: JSON.stringify(record) });
  } catch (e) {
    console.warn('Backend /api/teamLeaders not available (e.g. running on Cloudflare Pages). Saved to local storage.');
  }

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

  try {
    await fetchApi(`/api/teamLeaders/${item.id}`, { method: 'PUT', body: JSON.stringify(record) });
  } catch (e) {
    console.warn('Backend /api/teamLeaders not available. Updated in local storage.');
  }
}

export async function deleteTeamLeaderDoc(id: string) {
  try {
    const existing = getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
    const updated = existing.filter(tl => tl.id !== id);
    setLocal('eeu-team-leaders', updated);
  } catch (err) {
    console.error('Failed to delete team leader from localStorage:', err);
  }

  try {
    await fetchApi(`/api/teamLeaders/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Backend /api/teamLeaders not available. Deleted from local storage.');
  }
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
  await fetchApi('/api/feedbacks', { method: 'POST', body: JSON.stringify(record) });
  return record;
}
