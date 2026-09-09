import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FeederInterruption, InterruptionStatus } from '../types';
import { 
  addInterruptionDoc, 
  updateInterruptionDoc, 
  deleteInterruptionDoc, 
  subscribeToInterruptions,
  seedInitialDataIfEmpty
} from '../lib/apiService';

interface InterruptionContextType {
  interruptions: FeederInterruption[];
  setInterruptions: React.Dispatch<React.SetStateAction<FeederInterruption[]>>;
  addInterruption: (entry: Omit<FeederInterruption, 'id' | 'lastUpdated'>) => Promise<void>;
  updateInterruption: (id: string, entry: Partial<FeederInterruption>) => Promise<void>;
  deleteInterruption: (id: string) => Promise<void>;
  triggerToast: (title: string, desc: string, type?: 'info' | 'success' | 'warn') => void;
  liveToast: { title: string; desc: string; type: 'info' | 'success' | 'warn' } | null;
  setLiveToast: React.Dispatch<React.SetStateAction<{ title: string; desc: string; type: 'info' | 'success' | 'warn' } | null>>;
}

const InterruptionContext = createContext<InterruptionContextType | undefined>(undefined);

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
  try {
    channel = new window.BroadcastChannel('eeu_interruptions_channel');
  } catch (err) {
    console.warn('BroadcastChannel not accessible in this environment:', err);
    channel = null;
  }
}

export function useInterruptions() {
  const context = useContext(InterruptionContext);
  if (!context) {
    throw new Error('useInterruptions must be used within an InterruptionProvider');
  }
  return context;
}

export const InterruptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interruptions, setInterruptions] = useState<FeederInterruption[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('eeu-interruptions');
    let loaded: FeederInterruption[] = [];
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse interruptions from localStorage', e);
      }
    }
    
    // Deep deduplication safeguard and filter out legacy mock IDs and default entries
    const seen = new Set<string>();
    const legacyMockIds = new Set(['f-1', 'f-2', 'f-3', 'f-4', 'f-5', 'f-6', 'f-7', 'f-8', 'f-9', 'f-bll-11', 'f-bll-14', 'f-bll-03']);
    return (loaded || []).filter((item) => {
      if (!item || !item.id || seen.has(item.id) || legacyMockIds.has(item.id)) {
        return false;
      }
      if (item.feederName && (item.feederName.includes('BLL-11') || item.feederName.includes('BLL-14')) && (item.id.startsWith('f-bll') || item.id === 'f-11' || item.id === 'f-14')) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  });

  const [liveToast, setLiveToast] = useState<{ title: string; desc: string; type: 'info' | 'success' | 'warn' } | null>(null);

  // Protection maps to prevent background polling from reverting optimistic user actions (e.g. marking Restored)
  const pendingUpdatesRef = useRef<Map<string, { record: FeederInterruption; expiresAt: number }>>(new Map());
  const pendingDeletesRef = useRef<Map<string, number>>(new Map());

  const triggerToast = (title: string, desc: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setLiveToast({ title, desc, type });
    setTimeout(() => {
      setLiveToast(null);
    }, 4500);
  };

  // Broadcast channel message listener for instant cross-tab state syncing
  useEffect(() => {
    if (!channel) return;
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};
      if (type === 'SYNC_INTERRUPTIONS' && Array.isArray(data)) {
        setInterruptions(data);
        try {
          localStorage.setItem('eeu-interruptions', JSON.stringify(data));
        } catch (e) {
          console.error('Failed to persist synced data to localStorage', e);
        }
      }
    };
    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, []);

  // Storage event listener to sync across tabs if broadcast channel is inactive
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'eeu-interruptions' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setInterruptions(parsed);
          }
        } catch (err) {
          console.error('Storage sync parsing error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Subscribe to real-time updates from Database
  useEffect(() => {
    let isMounted = true;
    let unsub = () => {};
    seedInitialDataIfEmpty().then(() => {
      if (!isMounted) return;
      unsub = subscribeToInterruptions((items) => {
        if (!isMounted) return;
        const now = Date.now();

        // Clean expired pending mutations
        for (const [id, val] of pendingUpdatesRef.current.entries()) {
          if (val.expiresAt < now) {
            pendingUpdatesRef.current.delete(id);
          }
        }
        for (const [id, exp] of pendingDeletesRef.current.entries()) {
          if (exp < now) {
            pendingDeletesRef.current.delete(id);
          }
        }

        // Filter out pending deletes
        const nonDeleted = items.filter(item => !pendingDeletesRef.current.has(item.id));

        // Merge pending updates (e.g. freshly restored feeder line) so polling never reverts user actions
        const resolvedItems = nonDeleted.map(item => {
          const pending = pendingUpdatesRef.current.get(item.id);
          if (pending) {
            if (item.status === pending.record.status) {
              pendingUpdatesRef.current.delete(item.id);
              return item;
            }
            return { ...item, ...pending.record };
          }
          return item;
        });

        // Only trigger update if length or items are modified
        setInterruptions(prev => {
          const serializedPrev = JSON.stringify(prev);
          const serializedNext = JSON.stringify(resolvedItems);
          if (serializedPrev === serializedNext) return prev;
          
          try {
            localStorage.setItem('eeu-interruptions', serializedNext);
          } catch (e) {
            console.error('Failed to write Database updates to localStorage', e);
          }
          channel?.postMessage({ type: 'SYNC_INTERRUPTIONS', data: resolvedItems });
          return resolvedItems;
        });
      });
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Create interruption with local persistence fallback
  const addInterruption = async (entry: Omit<FeederInterruption, 'id' | 'lastUpdated'>) => {
    const tempId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestampStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const optimisticRecord: FeederInterruption = {
      id: tempId,
      feederName: entry.feederName,
      district: entry.district,
      type: entry.type,
      status: entry.status,
      startTime: entry.startTime,
      estimatedRestorationTime: entry.estimatedRestorationTime,
      affectedArea: entry.affectedArea,
      remark: entry.remark,
      lastUpdated: timestampStr
    };

    setInterruptions(prev => {
      const nextList = [optimisticRecord, ...prev.filter(i => i.id !== tempId)];
      try {
        localStorage.setItem('eeu-interruptions', JSON.stringify(nextList));
      } catch (e) {}
      channel?.postMessage({ type: 'SYNC_INTERRUPTIONS', data: nextList });
      return nextList;
    });

    triggerToast('New Outage Added', `${entry.feederName} has been synchronized across agent terminals`, 'warn');

    try {
      await addInterruptionDoc(entry, tempId);
    } catch (e: any) {
      console.error('Database addInterruptionDoc failed, using local offline fallback:', e);
      triggerToast('⚠️ Cloud Sync Blocked', `${entry.feederName} saved on this browser only! Supabase RLS is blocking cloud sync. Check top banner to fix.`, 'warn');
    }
  };

  // Update interruption with guaranteed synchronous resolution & optimistic locking
  const updateInterruption = async (id: string, entry: Partial<FeederInterruption>) => {
    // 1. Resolve existing record reliably without depending on React batching
    const existing = interruptions.find(item => item.id === id) || 
      (() => {
        try {
          const stored = localStorage.getItem('eeu-interruptions');
          if (stored) {
            const list: FeederInterruption[] = JSON.parse(stored);
            return list.find(item => item.id === id);
          }
        } catch {}
        return undefined;
      })();

    if (!existing) {
      console.warn(`[updateInterruption] Record ${id} not found in state or storage`);
      return;
    }

    const timestampStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const updatedRecord: FeederInterruption = {
      ...existing,
      ...entry,
      lastUpdated: timestampStr
    };

    // 2. Protect this record from being reverted by concurrent background polling
    pendingUpdatesRef.current.set(id, {
      record: updatedRecord,
      expiresAt: Date.now() + 15000
    });

    // 3. Immediately apply to local state, localStorage, and BroadcastChannel
    setInterruptions(prev => {
      const nextList = prev.map(item => item.id === id ? updatedRecord : item);
      try {
        localStorage.setItem('eeu-interruptions', JSON.stringify(nextList));
      } catch (e) {}
      channel?.postMessage({ type: 'SYNC_INTERRUPTIONS', data: nextList });
      return nextList;
    });

    // 4. Trigger UI notification toast immediately so user gets instant zero-lag confirmation
    if (entry.status && entry.status !== existing.status) {
      const titleText = entry.status === InterruptionStatus.RESTORED ? 'Feeder Line Cleared' : 'Operational Status Changed';
      const messageText = entry.status === InterruptionStatus.RESTORED 
        ? `${existing.feederName} restored to active grid status and re-energized successfully.`
        : `${existing.feederName} reassessed as ${entry.status}.`;
      triggerToast(titleText, messageText, entry.status === InterruptionStatus.RESTORED ? 'success' : 'info');
    } else {
      triggerToast('Record Updated', `Successfully updated grid data for ${existing.feederName}`, 'success');
    }

    // 5. Asynchronously persist to Supabase
    try {
      await updateInterruptionDoc(id, entry, existing);
    } catch (e: any) {
      console.error('Database updateInterruptionDoc failed, using local offline fallback:', e);
      triggerToast('⚠️ Cloud Sync Blocked', `Updated on this browser only! Supabase RLS is blocking updates.`, 'warn');
    }
  };

  // Delete interruption with local persistence fallback
  const deleteInterruption = async (id: string) => {
    const target = interruptions.find(i => i.id === id) || 
      (() => {
        try {
          const stored = localStorage.getItem('eeu-interruptions');
          if (stored) {
            const list: FeederInterruption[] = JSON.parse(stored);
            return list.find(item => item.id === id);
          }
        } catch {}
        return undefined;
      })();

    // Protect deletion from being reverted by concurrent background polling
    pendingDeletesRef.current.set(id, Date.now() + 15000);
    pendingUpdatesRef.current.delete(id);

    setInterruptions(prev => {
      const nextList = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('eeu-interruptions', JSON.stringify(nextList));
      } catch (e) {}
      channel?.postMessage({ type: 'SYNC_INTERRUPTIONS', data: nextList });
      return nextList;
    });

    if (target) {
      triggerToast('Record Removed', `${target.feederName} interruption cleared from dispatch lists.`, 'info');
    }

    try {
      await deleteInterruptionDoc(id);
    } catch (e: any) {
      console.error('Database deleteInterruptionDoc failed, keeping deletion locally:', e);
      if (target) {
        triggerToast('⚠️ Cloud Sync Blocked', `${target.feederName} deleted on this browser only! Supabase RLS is blocking deletion.`, 'warn');
      }
    }
  };

  return (
    <InterruptionContext.Provider value={{
      interruptions,
      setInterruptions,
      addInterruption,
      updateInterruption,
      deleteInterruption,
      triggerToast,
      liveToast,
      setLiveToast
    }}>
      {children}
    </InterruptionContext.Provider>
  );
};
