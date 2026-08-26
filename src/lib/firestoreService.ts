import { FeederInterruption, SystemNotification, InterruptionStatus, InterruptionType, TeamLeaderNote, ContactItem, TeamLeaderUser } from '../types';
import { INITIAL_FEEDERS_LIST, INITIAL_CUSTOMER_CONTACTS } from '../data/mockData';
import { FEEDERS_VERSION } from '../data/feedersList';
import { HubRecord, HUB_RECORDS } from '../data/hubData';

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
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function seedInitialDataIfEmpty() {
  const SEED_STORAGE_KEY = 'eeu-local-seeded-v3';
  if (typeof window !== 'undefined' && localStorage.getItem(SEED_STORAGE_KEY)) {
    return;
  }

  // Pre-seed API with defaults if they're empty
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
      const defaultTeamLeaders: TeamLeaderUser[] = [
        { id: 'tl-a', username: '@team_a', password: 'Tl@1234', name: 'Team A Leader', district: 'Team A', createdAt: new Date().toISOString() },
        { id: 'tl-b', username: '@team_b', password: 'Tl@1234', name: 'Team B Leader', district: 'Team B', createdAt: new Date().toISOString() },
        { id: 'tl-c', username: '@team_c', password: 'Tl@1234', name: 'Team C Leader', district: 'Team C', createdAt: new Date().toISOString() },
        { id: 'tl-d', username: '@team_d', password: 'Tl@1234', name: 'Zekarias Zenebe', district: 'Team D', createdAt: new Date().toISOString() }
      ];
      for (const tl of defaultTeamLeaders) {
        await fetchApi('/api/teamLeaders', { method: 'POST', body: JSON.stringify(tl) });
      }
    }
  } catch(e) {
     console.error("Failed to seed initial data:", e);
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

  await fetchApi('/api/interruptions', { method: 'POST', body: JSON.stringify(record) });

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

  await fetchApi('/api/notifications', { method: 'POST', body: JSON.stringify(newNoti) });

  return record;
}

export async function updateInterruptionDoc(id: string, entry: Partial<FeederInterruption>, existingRecord?: FeederInterruption) {
  const timestampStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  const merged = { ...existingRecord, ...entry, lastUpdated: timestampStr };
  await fetchApi(`/api/interruptions/${id}`, { method: 'PUT', body: JSON.stringify(merged) });

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

    await fetchApi('/api/notifications', { method: 'POST', body: JSON.stringify(changeNoti) });
  }
}

export async function deleteInterruptionDoc(id: string) {
  await fetchApi(`/api/interruptions/${id}`, { method: 'DELETE' });
}

export async function markAllNotificationsAsReadDoc() {
  await fetchApi('/api/notifications/read-all', { method: 'PUT' });
}

export async function markOneNotificationAsReadDoc(id: string) {
  await fetchApi(`/api/notifications/${id}/read`, { method: 'PUT' });
}

export async function clearAllNotificationsDoc() {
  await fetchApi('/api/notifications', { method: 'DELETE' });
}

export async function addPresetFeederDoc(feederStr: string) {
  await fetchApi('/api/presetFeeders', { method: 'POST', body: JSON.stringify({ id: `feeder-${Date.now()}`, feederStr }) });
}

export async function deletePresetFeederDoc(feederStr: string) {
  await fetchApi(`/api/presetFeeders/${encodeURIComponent(feederStr)}`, { method: 'DELETE' });
}

export async function updatePresetFeederDoc(oldFeederStr: string, newFeederStr: string) {
  await fetchApi('/api/presetFeeders', { method: 'PUT', body: JSON.stringify({ oldFeederStr, newFeederStr }) });
}

export async function resetAllPresetFeedersToMaster() {
  await fetchApi('/api/presetFeeders/bulk', { method: 'POST', body: JSON.stringify({ feeders: INITIAL_FEEDERS_LIST }) });
}

export function subscribeToHubRecords(onUpdate: (items: HubRecord[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/hubRecords').then(data => {
      onUpdate(data.length ? data : HUB_RECORDS);
      setLocal('eeu-hub-records', data);
    }).catch(e => {
      onUpdate(getLocal('eeu-hub-records', HUB_RECORDS));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 10000);
  return () => clearInterval(interval);
}

export async function updateHubRecordDoc(record: HubRecord) {
  await fetchApi(`/api/hubRecords/${record.no}`, { method: 'PUT', body: JSON.stringify(record) });
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
  await fetchApi('/api/teamLeaderNotes', { method: 'POST', body: JSON.stringify(record) });
  return record;
}

export async function updateTeamLeaderNoteDoc(id: string, content: string, isUrgent: boolean) {
  const timestampStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });
  await fetchApi(`/api/teamLeaderNotes/${id}`, { method: 'PUT', body: JSON.stringify({ content, isUrgent, timestamp: timestampStr }) });
}

export async function deleteTeamLeaderNoteDoc(id: string) {
  await fetchApi(`/api/teamLeaderNotes/${id}`, { method: 'DELETE' });
}

export async function clearTeamLeaderNotes() {
  await fetchApi('/api/teamLeaderNotes', { method: 'DELETE' });
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
  await fetchApi('/api/customerContacts', { method: 'POST', body: JSON.stringify(record) });
  return record;
}

export async function updateCustomerContactDoc(item: ContactItem) {
  await fetchApi(`/api/customerContacts/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
}

export async function deleteCustomerContactDoc(id: string) {
  await fetchApi(`/api/customerContacts/${id}`, { method: 'DELETE' });
}

export function subscribeToTeamLeaders(onUpdate: (items: TeamLeaderUser[]) => void) {
  const fetchItems = () => {
    fetchApi('/api/teamLeaders').then(data => {
      data.sort((a: any, b: any) => a.name.localeCompare(b.name));
      onUpdate(data);
      setLocal('eeu-team-leaders', data);
    }).catch(e => {
      onUpdate(getLocal('eeu-team-leaders', []));
    });
  };
  fetchItems();
  const interval = setInterval(fetchItems, 10000);
  return () => clearInterval(interval);
}

export async function addTeamLeaderDoc(item: Omit<TeamLeaderUser, 'id' | 'createdAt'>) {
  const newId = `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record: any = {
    id: newId,
    username: item.username.trim(),
    password: item.password.trim(),
    name: item.name.trim(),
    createdAt: new Date().toISOString()
  };
  if (item.district) record.district = item.district;
  if (typeof item.mustChangePassword === 'boolean') record.mustChangePassword = item.mustChangePassword;
  await fetchApi('/api/teamLeaders', { method: 'POST', body: JSON.stringify(record) });
  return record as TeamLeaderUser;
}

export async function updateTeamLeaderDoc(item: TeamLeaderUser) {
  const record: any = {
    username: item.username.trim(),
    password: item.password.trim(),
    name: item.name.trim(),
    createdAt: item.createdAt || new Date().toISOString()
  };
  if (item.district) record.district = item.district;
  if (typeof item.mustChangePassword === 'boolean') record.mustChangePassword = item.mustChangePassword;
  await fetchApi(`/api/teamLeaders/${item.id}`, { method: 'PUT', body: JSON.stringify(record) });
}

export async function deleteTeamLeaderDoc(id: string) {
  await fetchApi(`/api/teamLeaders/${id}`, { method: 'DELETE' });
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
