import React, { useState, useEffect } from 'react';
import { 
  Zap, Bell, Menu, X, ShieldAlert, CheckCircle2, AlertTriangle, 
  Settings, RefreshCw, Layers, LayoutGrid, Clock, LogOut, Sun, Moon,
  Headset, ShieldCheck, UserCheck, KeyRound, Eye, EyeOff, MessageCircle 
} from 'lucide-react';

// Context
import { useInterruptions } from './context/InterruptionContext';

// Types and mock data
import { FeederInterruption, InterruptionType, InterruptionStatus, SystemNotification, TeamLeaderNote, ContactItem, TeamLeaderUser, UserRole } from './types';
import { INITIAL_INTERRUPTIONS, INITIAL_NOTIFICATIONS, INITIAL_DISTRICTS, INITIAL_FEEDERS_LIST, INITIAL_CUSTOMER_CONTACTS } from './data/mockData';
import { FEEDERS_VERSION } from './data/feedersList';

// Database Services
import { 
  seedInitialDataIfEmpty,
  subscribeToInterruptions,
  subscribeToNotifications,
  subscribeToFeedersList,
  addInterruptionDoc,
  updateInterruptionDoc,
  deleteInterruptionDoc,
  markAllNotificationsAsReadDoc,
  markOneNotificationAsReadDoc,
  clearAllNotificationsDoc,
  addPresetFeederDoc,
  deletePresetFeederDoc,
  resetAllPresetFeedersToMaster,
  subscribeToHubRecords,
  updateHubRecordDoc,
  resetHubRecordsToDefaultDoc,
  subscribeToTeamLeaderNotes,
  addTeamLeaderNoteDoc,
  updateTeamLeaderNoteDoc,
  deleteTeamLeaderNoteDoc,
  clearTeamLeaderNotes,
  subscribeToCustomerContacts,
  addCustomerContactDoc,
  updateCustomerContactDoc,
  deleteCustomerContactDoc,
  subscribeToTeamLeaders,
  addTeamLeaderDoc,
  updateTeamLeaderDoc,
  deleteTeamLeaderDoc,
  DEFAULT_TEAM_LEADERS,
  getLocal
} from './lib/apiService';
import { HubRecord, HUB_RECORDS } from './data/hubData';

// Subcomponents
import Sidebar from './components/Sidebar';
import StatsGrid from './components/StatsGrid';
import AgentView from './components/AgentView';
import AdminPanel from './components/AdminPanel';
import NotificationCenter from './components/NotificationCenter';
import ResolutionArchive from './components/ResolutionArchive';
import BillCalculator from './components/BillCalculator';
import SmartMeterCalculator from './components/SmartMeterCalculator';
import EEUBillTariff from './components/EEUBillTariff';
import SmsTicketGenerator from './components/CustomerSmsGenerator';
import { FeederHub } from './components/FeederHub';
import CustomerContacts from './components/CustomerContacts';
import EEULogo from './components/EEULogo';
import WebLoginScreen from './components/WebLoginScreen';
import FeedbackModal from './components/FeedbackModal';

export default function App() {
  // 1. Theme State (strictly light mode)
  const isDarkMode = false;
  const toggleTheme = () => {
    // Theme toggling disabled to preserve strictly light mode
  };

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  // 2. Data State
  const {
    interruptions,
    setInterruptions,
    addInterruption: handleAddInterruption,
    updateInterruption: handleUpdateInterruption,
    deleteInterruption: handleDeleteInterruption,
    triggerToast,
    liveToast,
    setLiveToast
  } = useInterruptions();

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('eeu-notifications');
    let loaded: SystemNotification[] = [];
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load notifications from localStorage', e);
      }
    }
    // Deep deduplication safeguard and filtering of Emergency Diagnostics Launched & legacy mocks
    const seen = new Set<string>();
    const legacyNotifIds = new Set(['n-2', 'n-3', 'n-4']);
    return loaded.filter((item) => {
      if (!item || !item.id || seen.has(item.id) || legacyNotifIds.has(item.id)) {
        return false;
      }
      if (item.title === 'Emergency Diagnostics Launched') {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  });

  const [feedersList, setFeedersList] = useState<string[]>(() => {
    const saved = localStorage.getItem('eeu-feeders-list-v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = [...parsed];
          for (const item of INITIAL_FEEDERS_LIST) {
            const prefix = item.split(' (')[0].trim();
            if (!combined.some((s: string) => s.startsWith(prefix))) {
              combined.push(item);
            }
          }
          return combined;
        }
      } catch (e) {
        console.error('Failed to load feeders list from localStorage', e);
      }
    }
    return INITIAL_FEEDERS_LIST;
  });

  const [hubRecords, setHubRecords] = useState<HubRecord[]>(() => {
    return getLocal<HubRecord[]>('eeu-hub-records', HUB_RECORDS);
  });
  const [teamLeaderNotes, setTeamLeaderNotes] = useState<TeamLeaderNote[]>(() => {
    return getLocal<TeamLeaderNote[]>('eeu-team-leader-notes', []);
  });
  const [customerContacts, setCustomerContacts] = useState<ContactItem[]>(() => {
    return getLocal<ContactItem[]>('eeu-customer-contacts', INITIAL_CUSTOMER_CONTACTS);
  });
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderUser[]>(() => {
    return getLocal<TeamLeaderUser[]>('eeu-team-leaders', DEFAULT_TEAM_LEADERS);
  });

  // 3. User Authentication & Tab routing
  const [isWebLoggedIn, setIsWebLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('eeu-web-logged') === 'true';
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('eeu-admin-logged') === 'true';
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('eeu-user-role');
    if (saved === 'admin' || saved === 'team_leader' || saved === 'agent') {
      return saved as UserRole;
    }
    return isAdmin ? 'admin' : 'agent';
  });

  const [currentTeamLeader, setCurrentTeamLeader] = useState<TeamLeaderUser | null>(() => {
    const saved = localStorage.getItem('eeu-team-leader-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(() => {
    return localStorage.getItem('eeu-sidebar-minimized') === 'true';
  });

  const toggleSidebarMinimize = () => {
    setIsSidebarMinimized(prev => {
      const next = !prev;
      localStorage.setItem('eeu-sidebar-minimized', String(next));
      return next;
    });
  };

  // Seed initial data if needed and subscribe to Database updates in real-time
  useEffect(() => {
    let unsubNotifications = () => {};
    let unsubFeeders = () => {};
    let unsubHubRecords = () => {};
    let unsubNotes = () => {};
    let unsubCustomerContacts = () => {};
    let unsubTeamLeaders = () => {};

    seedInitialDataIfEmpty().then(() => {
      unsubNotifications = subscribeToNotifications((items) => {
        const filtered = items.filter(item => item && item.title !== 'Emergency Diagnostics Launched');
        setNotifications(filtered);
        localStorage.setItem('eeu-notifications', JSON.stringify(filtered));
      });
      unsubFeeders = subscribeToFeedersList((items) => {
        setFeedersList(items);
        localStorage.setItem('eeu-feeders-version', FEEDERS_VERSION);
        localStorage.setItem('eeu-feeders-list-v4', JSON.stringify(items));
      });
      unsubHubRecords = subscribeToHubRecords((items) => {
        setHubRecords(items);
      });
      unsubNotes = subscribeToTeamLeaderNotes((items) => {
        setTeamLeaderNotes(items);
      });
      unsubCustomerContacts = subscribeToCustomerContacts((items) => {
        setCustomerContacts(items);
      });
      unsubTeamLeaders = subscribeToTeamLeaders((items) => {
        setTeamLeaders(items);
      });
    });

    return () => {
      unsubNotifications();
      unsubFeeders();
      unsubHubRecords();
      unsubNotes();
      unsubCustomerContacts();
      unsubTeamLeaders();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('eeu-theme');
  }, []);

  // Administrative functions
  const handleLoginAdmin = (pin: string): boolean => {
    if (pin === '1234') {
      setIsAdmin(true);
      localStorage.setItem('eeu-admin-logged', 'true');
      setUserRole('admin');
      localStorage.setItem('eeu-user-role', 'admin');
      triggerToast('Admin Authorized', 'Successfully entered administrative grid controls', 'success');
      return true;
    }
    return false;
  };

  // Notifications operational state
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadDoc();
      triggerToast('All Read', 'Cleared unread notification counter badge', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneAsRead = async (id: string) => {
    try {
      await markOneNotificationAsReadDoc(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await clearAllNotificationsDoc();
      triggerToast('Logs Cleared', 'Empty notification feed registry', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // Syncing feeders list updates to Database
  const handleUpdateFeedersList = async (newList: string[]) => {
    try {
      const prevList = [...feedersList];
      setFeedersList(newList);
      localStorage.setItem('eeu-feeders-list-v4', JSON.stringify(newList));
      
      const added = newList.filter(x => !prevList.includes(x));
      const removed = prevList.filter(x => !newList.includes(x));

      for (const item of removed) {
        await deletePresetFeederDoc(item);
      }
      for (const item of added) {
        await addPresetFeederDoc(item);
      }
      if (added.length > 0) {
        const addedName = added[0].split(' (')[0];
        triggerToast('Feeder Preset Added', `New feeder "${addedName}" registered to database`, 'success');
      } else if (removed.length > 0) {
        triggerToast('Feeder Preset Removed', 'Feeder line removed from database', 'info');
      } else {
        triggerToast('Feeder Preset Updated', 'Feeder line database updated', 'success');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Sync Error', 'Error updating preset feeder lists', 'warn');
    }
  };

  const handleResetMasterFeeders = async () => {
    try {
      localStorage.setItem('eeu-feeders-version', FEEDERS_VERSION);
      localStorage.setItem('eeu-feeders-list-v4', JSON.stringify(INITIAL_FEEDERS_LIST));
      setFeedersList(INITIAL_FEEDERS_LIST);
      await resetAllPresetFeedersToMaster();
      triggerToast('Master Feeder Database Synced', `Restored all ${INITIAL_FEEDERS_LIST.length} EEU feeder lines`, 'success');
    } catch (e) {
      console.error(e);
      triggerToast('Sync Error', 'Could not reset master feeders', 'warn');
    }
  };

  // Simulated Dynamic Incident Generator
  const handleTriggerMockIncident = () => {
    // Pick random substation details
    const substations = [
      'Mexanisa Central - Feeder 04', 
      'Piazza Heritage - Feeder 02', 
      'Ayat Substation - Feeder 11', 
      'Bole Bulbula - Feeder 09', 
      'Saris Industrial - Feeder 07', 
      'Sululta Overheadline - Feeder 03'
    ];
    
    const chosenFeeder = substations[Math.floor(Math.random() * substations.length)];
    
    // Pick random district
    const chosenDistrict = INITIAL_DISTRICTS[Math.floor(Math.random() * INITIAL_DISTRICTS.length)];
    
    // Pick random type
    const incidentTypes = [
      { t: InterruptionType.EARTH_FAULT, r: 'Ground phase breakdown detected. Substation tripped protectively.' },
      { t: InterruptionType.SHORT_CIRCUIT, r: 'Tree line friction under heavy gusts. Insulators damaged.' },
      { t: InterruptionType.OPERATIONAL_INTERRUPTION, r: 'Replacing burnt overhead cables and tightening drop link lines.' }
    ];
    const pickedTypeObj = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
    
    // Areas
    const areas = [
      'Merkato Market, Raguel Church, and adjacent stalls',
      'Ayat Zone 3, Ayat Hospital vicinity, and local apartments',
      'Piazza Churchill Road, Taitu Hotel Street, and surrounding banks',
      'Saris Abo area, Cadisco vicinity, and surrounding industrial campuses',
      'Sululta town center, military camp area, and local residential grids'
    ];
    const chosenArea = areas[Math.floor(Math.random() * areas.length)];

    const now = new Date();
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const formatTime = (d: Date) => d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    handleAddInterruption({
      feederName: chosenFeeder,
      district: chosenDistrict,
      type: pickedTypeObj.t,
      status: InterruptionStatus.ACTIVE,
      startTime: formatTime(now),
      estimatedRestorationTime: formatTime(future),
      affectedArea: chosenArea,
      remark: pickedTypeObj.r
    });
  };

  // Team Leader CRUD handlers
  const handleAddTeamLeader = async (tl: Omit<TeamLeaderUser, 'id' | 'createdAt'>) => {
    try {
      const created = await addTeamLeaderDoc(tl);
      if (created) {
        setTeamLeaders(prev => [...prev.filter(x => x.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      triggerToast('Team Leader Account Created', `Created account for ${tl.name} (${tl.username})`, 'success');
    } catch (err) {
      triggerToast('Failed to Create Account', 'Could not save Team Leader account', 'warn');
    }
  };

  const handleUpdateTeamLeader = async (tl: TeamLeaderUser) => {
    try {
      await updateTeamLeaderDoc(tl);
      setTeamLeaders(prev => prev.map(x => x.id === tl.id ? tl : x).sort((a, b) => a.name.localeCompare(b.name)));
      triggerToast('Credentials Updated', `Saved updated credentials for ${tl.name}`, 'success');
    } catch (err) {
      triggerToast('Failed to Update', 'Could not save updated credentials', 'warn');
    }
  };

  const handleDeleteTeamLeader = async (id: string) => {
    try {
      await deleteTeamLeaderDoc(id);
      setTeamLeaders(prev => prev.filter(x => x.id !== id));
      triggerToast('Account Deleted', 'Team leader credentials removed', 'info');
    } catch (err) {
      triggerToast('Failed to Delete', 'Could not delete Team Leader account', 'warn');
    }
  };

  const handleLoginSuccess = (role: UserRole, teamLeader?: TeamLeaderUser) => {
    setUserRole(role);
    localStorage.setItem('eeu-user-role', role);
    setIsWebLoggedIn(true);
    localStorage.setItem('eeu-web-logged', 'true');

    if (role === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('eeu-admin-logged', 'true');
      setCurrentTeamLeader(null);
      localStorage.removeItem('eeu-team-leader-user');
      triggerToast('Admin Authorized', 'Logged in as Admin with full system control', 'success');
      setCurrentTab('admin');
    } else if (role === 'team_leader') {
      setIsAdmin(false);
      localStorage.setItem('eeu-admin-logged', 'false');
      if (teamLeader) {
        setCurrentTeamLeader(teamLeader);
        localStorage.setItem('eeu-team-leader-user', JSON.stringify(teamLeader));
      }
      triggerToast('Team Leader Authorized', `Welcome ${teamLeader?.name || 'Team Leader'} - Add Interruption Role Active`, 'success');
      setCurrentTab('admin');
    } else {
      setIsAdmin(false);
      localStorage.setItem('eeu-admin-logged', 'false');
      setCurrentTeamLeader(null);
      localStorage.removeItem('eeu-team-leader-user');
      triggerToast('Call Agent Signed In', 'Logged in as Call Center Agent', 'info');
      setCurrentTab('dashboard');
    }
  };

  // Logout website session
  const handleLogoutWeb = () => {
    setIsWebLoggedIn(false);
    localStorage.setItem('eeu-web-logged', 'false');
    setIsAdmin(false);
    localStorage.setItem('eeu-admin-logged', 'false');
    setUserRole('agent');
    localStorage.setItem('eeu-user-role', 'agent');
    setCurrentTeamLeader(null);
    localStorage.removeItem('eeu-team-leader-user');
    setCurrentTab('dashboard');
  };

  // Logout admin mode
  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    localStorage.setItem('eeu-admin-logged', 'false');
    setUserRole('agent');
    localStorage.setItem('eeu-user-role', 'agent');
    setCurrentTeamLeader(null);
    localStorage.removeItem('eeu-team-leader-user');
    triggerToast('Admin Logged Out', 'Switched back to Call Center Agent view mode', 'info');
    setCurrentTab('dashboard');
  };

  // Aggregate stats
  const activeUnreadCount = notifications.filter(n => !n.read).length;

  if (!isWebLoggedIn) {
    return (
      <WebLoginScreen
        teamLeaders={teamLeaders}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen mesh-bg text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
        
        {/* TOP MOBILE HEADER */}
        <header className="lg:hidden p-4 border-b border-gray-200/30 dark:border-gray-900/30 flex items-center justify-between glass-card rounded-none z-20 sticky top-0">
          <div className="flex items-center gap-2">
            <EEULogo size={32} />
            <div>
              <span className="font-display font-medium text-[9px] leading-none text-[#F48B20] block">የኢትዮጵያ ኤሌክትሪክ አገልግሎት</span>
              <h1 className="font-display font-bold text-[10px] tracking-tight text-[#5FA354] dark:text-[#5FA354] mt-0.5">Ethiopian Electric Utility</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Indicator badge */}
            <button
              id="mobile-tab-noti-toggle"
              onClick={() => setCurrentTab('notifications')}
              className="p-2 text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {activeUnreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            {/* Mobile Hamburger menu */}
            <button
              id="mobile-menu-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/60 rounded-lg hover:shadow-md hover:shadow-black/10 dark:hover:shadow-black/40 transition-all duration-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* MOBILE MENU NAV DROPDOWN */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-900 p-4 space-y-2 text-left animate-in slide-in-from-top-4 duration-200 z-40 fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="text-[9px] font-bold text-gray-400 tracking-wider uppercase px-2 mb-1">Grid Portals</div>
            
            <button
              id="mob-nav-dashboard"
              onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'dashboard' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Call Center Grid Board
            </button>

            {isAdmin && (
              <button
                id="mob-nav-admin"
                onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
                className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'admin' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Feeder Admin Panel
              </button>
            )}

            <button
              id="mob-nav-notifications"
              onClick={() => { setCurrentTab('notifications'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${currentTab === 'notifications' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <span>Incident Feeds</span>
              {activeUnreadCount > 0 && (
                <span className="py-0.5 px-2 text-[10px] bg-red-500 rounded-full text-white font-bold">{activeUnreadCount}</span>
              )}
            </button>

            <button
              id="mob-nav-history"
              onClick={() => { setCurrentTab('history'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'history' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Restored Feeders
            </button>

            <button
              id="mob-nav-sms-generator"
              onClick={() => { setCurrentTab('sms_generator'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'sms_generator' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              SMS Ticket Generator
            </button>

            <button
              id="mob-nav-calculator"
              onClick={() => { setCurrentTab('calculator'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'calculator' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Bill Calculator
            </button>

            <button
              id="mob-nav-smartmeter"
              onClick={() => { setCurrentTab('smartmeter'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'smartmeter' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Smart Meter Calculator
            </button>

            <button
              id="mob-nav-tariff"
              onClick={() => { setCurrentTab('tariff'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'tariff' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              EEU Bill Tarrif
            </button>

            <button
              id="mob-nav-hub"
              onClick={() => { setCurrentTab('hub'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'hub' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              CSC ADDRESS Directory
            </button>

            <button
              id="mob-nav-contacts"
              onClick={() => { setCurrentTab('contacts'); setMobileMenuOpen(false); }}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${currentTab === 'contacts' ? 'bg-eeu-green text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Other Region Phone NO
            </button>

            <button
              id="mob-nav-feedback"
              onClick={() => { setIsFeedbackModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-eeu-green" />
              <span>Website Feedback</span>
            </button>

            <button
              id="mob-web-logout-btn"
              onClick={() => { handleLogoutWeb(); setMobileMenuOpen(false); }}
              className="w-full mt-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>SIGN OUT PORTAL</span>
            </button>

            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center select-none pt-2.5 font-sans border-t border-gray-100 dark:border-gray-900/40">
              Developed by <span className="text-eeu-green font-semibold">Zekarias Zenebe</span>
            </div>
          </div>
        )}

        {/* MAIN STRUCTURAL LAYOUT COMPONENT */}
        <div className="flex-1 flex min-h-0 relative">
          
          {/* DESKTOP SIDEBAR PANEL */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            isAdmin={isAdmin}
            userRole={userRole}
            isTeamLeader={userRole === 'team_leader'}
            currentTeamLeader={currentTeamLeader}
            onLogoutAdmin={handleLogoutAdmin}
            onLogoutWeb={handleLogoutWeb}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            notificationCount={activeUnreadCount}
            isMinimized={isSidebarMinimized}
            onToggleMinimize={toggleSidebarMinimize}
          />

          {/* RIGHT SIDE MAIN CONTAINER */}
          <main className={`flex-1 ${isSidebarMinimized ? 'lg:pl-24' : 'lg:pl-72'} p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto transition-all duration-300`}>
            
            {/* TOP HEADER STATUS ROW (DESKTOP) */}
            <div className="max-lg:hidden flex items-center justify-between gap-4 pt-5 lg:pt-8 pb-4 border-b border-gray-200/40 dark:border-gray-800/40">
              <div className="text-left">
                <span className="text-xs text-[#5FA354] dark:text-[#5FA354] font-bold uppercase tracking-wider font-sans flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5FA354] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5FA354]"></span>
                  </span>
                  የኢትዮጵያ ኤሌክትሪክ አገልግሎት <span className="text-gray-300 dark:text-gray-700">|</span> Ethiopian Electric Utility
                </span>
                <h1 className="text-[25px] font-display font-black tracking-tight text-gray-950 dark:text-white mt-1">
                  Feeder Interruption For Contact Center
                </h1>
              </div>

              {/* User Profile Pill Card & Action Buttons */}
              <div className="flex items-center gap-2.5">
                {/* Feedback Button */}
                <button
                  id="header-feedback-btn"
                  onClick={() => setIsFeedbackModalOpen(true)}
                  title="Share Website Feedback via Email (zekariaszenebe21@gmail.com)"
                  className="relative h-10 px-3.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs hover:shadow flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-eeu-green dark:hover:text-eeu-green hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-eeu-green" />
                  <span>Feedback</span>
                </button>

                {/* Notifications Button */}
                <button
                  id="header-notification-toggle"
                  onClick={() => setCurrentTab('notifications')}
                  title="Notifications"
                  className="relative w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer shrink-0"
                >
                  <Bell className="w-4.5 h-4.5 text-slate-700 dark:text-slate-200" />
                  {activeUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {activeUnreadCount > 9 ? '9+' : activeUnreadCount}
                    </span>
                  )}
                </button>

                {/* User Profile Pill Card */}
                <div id="user-profile-pill" className="flex items-center gap-2.5 p-1.5 pr-4 pl-2 glass-card rounded-full shadow-sm border border-solid border-gray-250/70 dark:border-gray-800 select-none w-[175px] text-left">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isAdmin 
                      ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' 
                      : userRole === 'team_leader'
                      ? 'bg-sky-500/15 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-4.5 h-4.5" /> : userRole === 'team_leader' ? <UserCheck className="w-4.5 h-4.5" /> : <Headset className="w-4.5 h-4.5" />}
                  </div>
                  <div className="flex flex-col text-left leading-tight overflow-hidden">
                    <span className="text-xs font-bold text-gray-950 dark:text-white font-sans tracking-tight truncate">
                      {isAdmin ? 'Admin' : userRole === 'team_leader' ? (currentTeamLeader?.name || 'Team Leader') : 'Call Agent'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE DATA STATISTICS ROW */}
            {currentTab !== 'hub' && currentTab !== 'admin' && currentTab !== 'notifications' && currentTab !== 'history' && currentTab !== 'contacts' && currentTab !== 'calculator' && currentTab !== 'smartmeter' && currentTab !== 'tariff' && currentTab !== 'sms_generator' && <StatsGrid interruptions={interruptions} />}

            {/* DETAILED VIEWS CONTAINER */}
            <div id="active-tab-container" className="pt-2 animate-in fade-in-40 duration-200">
              {currentTab === 'dashboard' && (
                <AgentView 
                  interruptions={interruptions} 
                  onTriggerMockIncident={handleTriggerMockIncident} 
                  isAdmin={isAdmin}
                  teamLeaderNotes={teamLeaderNotes}
                />
              )}

              {currentTab === 'admin' && (isAdmin || userRole === 'team_leader') && (
                <AdminPanel
                  isAdmin={isAdmin}
                  isTeamLeader={userRole === 'team_leader'}
                  userRole={userRole}
                  currentTeamLeader={currentTeamLeader}
                  onLoginAdmin={handleLoginAdmin}
                  onLogoutAdmin={handleLogoutAdmin}
                  onSwitchToAgentMode={() => setCurrentTab('dashboard')}
                  interruptions={interruptions}
                  onAddInterruption={handleAddInterruption}
                  onUpdateInterruption={handleUpdateInterruption}
                  onDeleteInterruption={handleDeleteInterruption}
                  feedersList={feedersList}
                  onUpdateFeedersList={handleUpdateFeedersList}
                  onResetMasterFeeders={handleResetMasterFeeders}
                  teamLeaders={teamLeaders}
                  onAddTeamLeader={handleAddTeamLeader}
                  onUpdateTeamLeader={handleUpdateTeamLeader}
                  onDeleteTeamLeader={handleDeleteTeamLeader}
                />
              )}

              {currentTab === 'notifications' && (
                <NotificationCenter
                  notifications={notifications}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onMarkOneAsRead={handleMarkOneAsRead}
                  onClearAllNotifications={handleClearAllNotifications}
                  interruptions={interruptions}
                />
              )}

              {currentTab === 'history' && (
                <ResolutionArchive interruptions={interruptions} />
              )}

              {currentTab === 'sms_generator' && (
                <SmsTicketGenerator />
              )}

              {currentTab === 'calculator' && (
                <BillCalculator />
              )}

              {currentTab === 'smartmeter' && (
                <SmartMeterCalculator />
              )}

              {currentTab === 'tariff' && (
                <EEUBillTariff />
              )}

              {currentTab === 'hub' && (
                <FeederHub 
                  isAdmin={isAdmin || userRole === 'team_leader'} 
                  hubRecords={hubRecords} 
                  onUpdateRecord={updateHubRecordDoc} 
                  onResetRecords={resetHubRecordsToDefaultDoc}
                />
              )}

              {currentTab === 'contacts' && (
                <CustomerContacts 
                  isAdmin={isAdmin}
                  contacts={customerContacts}
                  onAddContact={addCustomerContactDoc}
                  onUpdateContact={updateCustomerContactDoc}
                  onDeleteContact={deleteCustomerContactDoc}
                />
              )}
            </div>
          </main>
        </div>

        {/* FIXED FLOATING LIVE TOAST/NOTIFICATION POPUP */}
        {liveToast && (
          <div className="fixed bottom-6 right-6 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl flex items-start gap-3.5 z-55 max-w-sm animate-in slide-in-from-bottom-5 duration-200">
            <div className={`p-2 rounded-xl text-white shrink-0 ${
              liveToast.type === 'success' 
                ? 'bg-eeu-green' 
                : liveToast.type === 'warn' 
                ? 'bg-red-500' 
                : 'bg-blue-600'
            }`}>
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="flex-1 text-left">
              <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-normal">
                {liveToast.title}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-300 mt-1 leading-normal">
                {liveToast.desc}
              </p>
            </div>
            
            <button
              id="toast-close-btn"
              onClick={() => setLiveToast(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* BOTTOM ACCENT BAR Representing Ethiopian Electric Utility */}
        <footer id="branding-footer" className={`py-3 px-6 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900/60 text-center flex items-center justify-end text-[10px] text-gray-400 dark:text-gray-500 font-mono select-none transition-all duration-300 ${isSidebarMinimized ? 'lg:pl-24' : 'lg:pl-72'}`}>
          <div className="flex items-center gap-2 justify-end ml-auto">
            <EEULogo size={18} />
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-semibold text-[#F48B20]">የኢትዮጵያ ኤሌክትሪክ አገልግሎት</span>
              <span className="text-gray-300 dark:text-gray-800">|</span>
              <span className="font-sans font-bold text-[#5FA354]">Ethiopian Electric Utility (EEU)</span>
            </div>
          </div>
        </footer>

        {/* FEEDBACK MODAL */}
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          userRole={isAdmin ? 'Admin' : userRole === 'team_leader' ? 'Team Leader' : 'Call Agent'}
          userName={isAdmin ? 'Admin' : currentTeamLeader?.name}
        />

      </div>
    </div>
  );
}
