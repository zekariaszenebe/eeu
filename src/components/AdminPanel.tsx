import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Lock, Unlock, Plus, Edit3, CheckCircle2, Trash2, X, AlertCircle, 
  RefreshCw, Info, MapPin, Zap, Clock, ShieldCheck, HelpCircle, Download, Copy, Check, Building,
  UserCheck, Users, Eye, EyeOff, UserPlus, KeyRound, Shield, Search
} from 'lucide-react';
import { FeederInterruption, InterruptionType, InterruptionStatus, stripBrackets, TeamLeaderUser, UserRole } from '../types';
import { INITIAL_DISTRICTS, INITIAL_FEEDERS_LIST } from '../data/mockData';
import { InterruptionTypeBadge, getCardinalDirection } from './AgentView';
import { LanguageMode, translateAmharicLocation, formatLocationDisplay } from '../utils/locationLanguage';

// Helper to parse feeder name and its Amharic location details
const parseFeeder = (feederStr: string) => {
  try {
    if (!feederStr) return { feederLine: '', amharicLocation: '' };
    const parenIndex = feederStr.indexOf('(');
    if (parenIndex !== -1) {
      const feederLine = feederStr.substring(0, parenIndex).trim();
      const closeIndex = feederStr.lastIndexOf(')');
      const amharicLocation = closeIndex !== -1 
        ? feederStr.substring(parenIndex + 1, closeIndex).trim() 
        : feederStr.substring(parenIndex + 1).trim();
      return { feederLine, amharicLocation };
    }
    return { feederLine: feederStr, amharicLocation: '' };
  } catch (err) {
    console.error('Failed to parse feeder string:', feederStr, err);
    return { feederLine: feederStr || '', amharicLocation: '' };
  }
};

export const normalizeFeederName = (name: string) => {
  try {
    if (!name) return '';
    const parsed = parseFeeder(name);
    return (parsed.feederLine || name).trim().toLowerCase();
  } catch (err) {
    console.error('Failed to normalize feeder name:', name, err);
    return (name || '').trim().toLowerCase();
  }
};

export const parseFeederDetails = (feederLine: string) => {
  try {
    if (!feederLine) return { substation: 'N/A', feederId: '' };
    const parts = feederLine.split(' - ');
    if (parts.length >= 2) {
      const substation = parts[0].trim();
      const feederId = parts.slice(1).join(' - ').trim();
      return { substation, feederId };
    }
    return { substation: 'N/A', feederId: feederLine };
  } catch (err) {
    console.error('Failed to parse feeder details:', feederLine, err);
    return { substation: 'N/A', feederId: feederLine || '' };
  }
};

interface AdminPanelProps {
  isAdmin: boolean;
  isTeamLeader?: boolean;
  userRole?: UserRole;
  currentTeamLeader?: TeamLeaderUser | null;
  onLoginAdmin: (pin: string) => boolean;
  onLogoutAdmin: () => void;
  onSwitchToAgentMode?: () => void;
  interruptions: FeederInterruption[];
  onAddInterruption: (entry: Omit<FeederInterruption, 'id' | 'lastUpdated'>) => void;
  onUpdateInterruption: (id: string, entry: Partial<FeederInterruption>) => void;
  onDeleteInterruption: (id: string) => void;
  feedersList?: string[];
  onUpdateFeedersList?: (list: string[]) => void;
  onResetMasterFeeders?: () => void;
  teamLeaders?: TeamLeaderUser[];
  onAddTeamLeader?: (tl: Omit<TeamLeaderUser, 'id' | 'createdAt'>) => void;
  onUpdateTeamLeader?: (tl: TeamLeaderUser) => void;
  onDeleteTeamLeader?: (id: string) => void;
}

export default function AdminPanel({
  isAdmin,
  isTeamLeader = false,
  userRole = 'agent',
  currentTeamLeader,
  onLoginAdmin,
  onLogoutAdmin,
  onSwitchToAgentMode,
  interruptions,
  onAddInterruption,
  onUpdateInterruption,
  onDeleteInterruption,
  feedersList,
  onUpdateFeedersList,
  onResetMasterFeeders,
  teamLeaders = [],
  onAddTeamLeader,
  onUpdateTeamLeader,
  onDeleteTeamLeader
}: AdminPanelProps) {
  // Authentication variables
  const [pinCode, setPinCode] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Dynamic Base Feeder entries
  const activeFeeders = feedersList || INITIAL_FEEDERS_LIST;
  const handleUpdateFeeders = (newList: string[]) => {
    if (onUpdateFeedersList) {
      onUpdateFeedersList(newList);
    }
  };

  // Switch tabs between Outages board vs Presets Database manager vs Team Leaders User Management
  const [adminSubTab, setAdminSubTab] = useState<'outages' | 'feeders' | 'team_leaders'>('outages');

  // Form toggles
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeederInterruption | null>(null);

  // Form state
  const [feederName, setFeederName] = useState('');
  const [formFeederSearchQuery, setFormFeederSearchQuery] = useState('');
  const [formFeederDropdownOpen, setFormFeederDropdownOpen] = useState(false);
  const [customFeederEnabled, setCustomFeederEnabled] = useState(false);
  const [customFeederName, setCustomFeederName] = useState('');
  const [district, setDistrict] = useState(INITIAL_DISTRICTS[0]);
  const [type, setType] = useState<InterruptionType>(InterruptionType.EARTH_FAULT);
  const [status, setStatus] = useState<InterruptionStatus>(InterruptionStatus.ACTIVE);
  const [startTime, setStartTime] = useState('');
  const [estimatedRestoration, setEstimatedRestoration] = useState('');
  const [affectedArea, setAffectedArea] = useState('');
  const [remark, setRemark] = useState('');

  // Form message feedback
  const [formError, setFormError] = useState('');

  // Form state for managing master feeders list
  const [feederSearchQuery, setFeederSearchQuery] = useState('');
  const [feederLangMode, setFeederLangMode] = useState<LanguageMode>('am');
  const [showFeederModal, setShowFeederModal] = useState(false);
  const [editingFeederIdx, setEditingFeederIdx] = useState<number | null>(null);
  const [feederFormSubstation, setFeederFormSubstation] = useState('');
  const [feederFormCode, setFeederFormCode] = useState('');
  const [feederFormArea, setFeederFormArea] = useState('');
  const [feederFormError, setFeederFormError] = useState('');
  const [csvCopied, setCsvCopied] = useState(false);

  // Team Leaders state for Admin user management subtab
  const [showTLModal, setShowTLModal] = useState(false);
  const [editingTL, setEditingTL] = useState<TeamLeaderUser | null>(null);
  const [tlName, setTlName] = useState('');
  const [tlDistrict, setTlDistrict] = useState(INITIAL_DISTRICTS[0]);
  const [tlRole, setTlRole] = useState<UserRole>('team_leader');
  const [tlUsername, setTlUsername] = useState('');
  const [tlPassword, setTlPassword] = useState('');

  const [tlFormError, setTlFormError] = useState('');
  const [visibleTLPasswords, setVisibleTLPasswords] = useState<Record<string, boolean>>({});

  const toggleTLPasswordVisibility = (id: string) => {
    setVisibleTLPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddTL = () => {
    setEditingTL(null);
    setTlName('');
    setTlDistrict(INITIAL_DISTRICTS[0]);
    setTlRole('team_leader');
    setTlUsername('');
    setTlPassword('');
    setTlFormError('');
    setShowTLModal(true);
  };

  const handleOpenEditTL = (tl: TeamLeaderUser) => {
    setEditingTL(tl);
    setTlName(tl.name);
    setTlDistrict(tl.district || INITIAL_DISTRICTS[0]);
    setTlRole(tl.role || 'team_leader');
    setTlUsername(tl.username);
    setTlPassword(tl.password);
    setTlFormError('');
    setShowTLModal(true);
  };

  const handleSaveTL = (e: React.FormEvent) => {
    e.preventDefault();
    setTlFormError('');

    if (!tlName.trim()) {
      setTlFormError('Please enter the team leader name.');
      return;
    }
    if (!tlUsername.trim()) {
      setTlFormError('Please enter a valid username.');
      return;
    }
    if (!tlPassword.trim()) {
      setTlFormError('Please enter a password.');
      return;
    }

    const cleanUser = tlUsername.trim();

    // Check duplicate username if adding or changing
    const duplicate = teamLeaders.find(tl => 
      tl.id !== editingTL?.id && tl.username.trim().toLowerCase() === cleanUser.toLowerCase()
    );
    if (duplicate) {
      setTlFormError(`Username ${cleanUser} is already assigned to another team leader.`);
      return;
    }

    if (editingTL) {
      if (onUpdateTeamLeader) {
        onUpdateTeamLeader({
          ...editingTL,
          name: tlName.trim(),
          district: tlDistrict,
          role: tlRole,
          username: cleanUser,
          password: tlPassword.trim()
        });
      }
    } else {
      if (onAddTeamLeader) {
        onAddTeamLeader({
          name: tlName.trim(),
          district: tlDistrict,
          role: tlRole,
          username: cleanUser,
          password: tlPassword.trim()
        });
      }
    }

    setShowTLModal(false);
  };

  // Deletion confirmation custom overlay state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    idOrStr: string;
    name: string;
    type: 'interruption' | 'feeder' | 'team_leader';
  } | null>(null);

  const [adminRlsNotice, setAdminRlsNotice] = useState<{ table: string; message: string } | null>(null);
  const [adminCopiedSql, setAdminCopiedSql] = useState(false);

  useEffect(() => {
    const handleRlsNotice = (e: any) => {
      if (e.detail) {
        setAdminRlsNotice(e.detail);
      }
    };
    window.addEventListener('supabase-rls-notice', handleRlsNotice);
    return () => window.removeEventListener('supabase-rls-notice', handleRlsNotice);
  }, []);

  const copyRlsSql = () => {
    const sql = `-- Disable RLS on the app tables so all users can sync data\nALTER TABLE "interruptions" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "teamLeaders" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "teamLeaderNotes" DISABLE ROW LEVEL SECURITY;\n\n-- Enable Realtime broadcast on all tables\nALTER PUBLICATION supabase_realtime ADD TABLE "interruptions";\nALTER PUBLICATION supabase_realtime ADD TABLE "notifications";\nALTER PUBLICATION supabase_realtime ADD TABLE "teamLeaders";\nALTER PUBLICATION supabase_realtime ADD TABLE "teamLeaderNotes";`;
    navigator.clipboard.writeText(sql);
    setAdminCopiedSql(true);
    setTimeout(() => setAdminCopiedSql(false), 3000);
  };

  // Initialize form for adding
  const handleOpenAddForm = () => {
    setEditingItem(null);
    setFeederName('');
    setFormFeederSearchQuery('');
    setFormFeederDropdownOpen(false);
    setCustomFeederEnabled(false);
    setCustomFeederName('');

    // Default district based on role: team leaders are locked to their assigned team (e.g. Team D for Zekarias Zenebe)
    if (isTeamLeader || userRole === 'team_leader') {
      setDistrict(currentTeamLeader?.district || 'Team D');
    } else {
      setDistrict(INITIAL_DISTRICTS[0]);
    }

    setType(InterruptionType.EARTH_FAULT);
    setStatus(InterruptionStatus.ACTIVE);
    
    // Default current time
    const now = new Date();
    setStartTime(now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }));
    
    // Default estimated 3 hours from now
    const future = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    setEstimatedRestoration(future.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }));
    
    setAffectedArea('');
    setRemark('');
    setFormError('');
    setShowFormModal(true);
  };

  // Initialize form for editing
  const handleOpenEditForm = (item: FeederInterruption) => {
    setEditingItem(item);
    
    const matchedPreset = activeFeeders.find(f => {
      const parsed = parseFeeder(f);
      return parsed.feederLine === item.feederName || f === item.feederName;
    });

    if (matchedPreset) {
      const parsed = parseFeeder(matchedPreset);
      setFeederName(parsed.feederLine);
      setFormFeederSearchQuery(parsed.feederLine);
      setFormFeederDropdownOpen(false);
      setCustomFeederEnabled(false);
      setCustomFeederName('');
    } else {
      setFeederName('');
      setFormFeederSearchQuery(item.feederName);
      setFormFeederDropdownOpen(false);
      setCustomFeederEnabled(true);
      setCustomFeederName(item.feederName);
    }
    
    setDistrict(item.district);
    setType(item.type);
    setStatus(item.status);
    setStartTime(item.startTime);
    setEstimatedRestoration(item.estimatedRestorationTime);
    setAffectedArea(item.affectedArea);
    setRemark(item.remark);
    setFormError('');
    setShowFormModal(true);
  };

  // Master Feeder List handlers
  const handleOpenAddFeeder = () => {
    setEditingFeederIdx(null);
    setFeederFormSubstation('');
    setFeederFormCode('');
    setFeederFormArea('');
    setFeederFormError('');
    setShowFeederModal(true);
  };

  const handleOpenEditFeeder = (feederStr: string, index: number) => {
    const globalIdx = activeFeeders.findIndex(f => f === feederStr);
    setEditingFeederIdx(globalIdx !== -1 ? globalIdx : index);
    
    const { feederLine, amharicLocation } = parseFeeder(feederStr);
    const { substation, feederId } = parseFeederDetails(feederLine);
    setFeederFormSubstation(substation);
    setFeederFormCode(feederId);
    setFeederFormArea(amharicLocation);
    setFeederFormError('');
    setShowFeederModal(true);
  };

  const handleFeederFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feederFormSubstation.trim()) {
      setFeederFormError('Please enter Substation Details.');
      return;
    }
    if (!feederFormCode.trim()) {
      setFeederFormError('Please enter a Feeder Identifier.');
      return;
    }

    const fullFeederLine = `${feederFormSubstation.trim()} - ${feederFormCode.trim()}`;

    const combined = feederFormArea.trim() 
      ? `${fullFeederLine} (${feederFormArea.trim()})`
      : fullFeederLine;

    const newList = [...activeFeeders];
    
    if (editingFeederIdx !== null) {
      const oldFeederStr = newList[editingFeederIdx];
      const oldParsed = parseFeeder(oldFeederStr);
      const newParsed = parseFeeder(combined);

      newList[editingFeederIdx] = combined;

      // Automatically cascade edit: Rename feeder line and update associated community areas across all interruption records!
      const normOldLine = normalizeFeederName(oldParsed.feederLine);
      const normOldStr = normalizeFeederName(oldFeederStr);

      interruptions.forEach((item) => {
        const normItem = normalizeFeederName(item.feederName);
        const isMatch = normItem === normOldLine || 
                        normItem === normOldStr || 
                        item.feederName.trim().toLowerCase() === oldParsed.feederLine.trim().toLowerCase() ||
                        item.feederName.trim().toLowerCase() === oldFeederStr.trim().toLowerCase();

        if (isMatch) {
          const updates: Partial<FeederInterruption> = {};
          if (oldParsed.feederLine !== newParsed.feederLine) {
            updates.feederName = newParsed.feederLine;
          }
          if (newParsed.amharicLocation && (item.affectedArea === oldParsed.amharicLocation || !item.affectedArea || oldParsed.amharicLocation !== newParsed.amharicLocation)) {
            updates.affectedArea = newParsed.amharicLocation;
          }
          if (Object.keys(updates).length > 0) {
            onUpdateInterruption(item.id, updates);
          }
        }
      });
    } else {
      // Check for duplicate names
      const duplicate = newList.some(f => parseFeeder(f).feederLine.toLowerCase() === fullFeederLine.toLowerCase());
      if (duplicate) {
        setFeederFormError('A feeder line with this name already exists.');
        return;
      }
      newList.push(combined);
    }

    handleUpdateFeeders(newList);
    setShowFeederModal(false);
  };

  const handleDeleteFeeder = (feederStr: string) => {
    const newList = activeFeeders.filter((f) => f !== feederStr);
    handleUpdateFeeders(newList);
  };

  // Logic to process login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLoginAdmin(pinCode);
    if (success) {
      setLoginError(false);
      setPinCode('');
    } else {
      setLoginError(true);
    }
  };

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalFeederName = customFeederEnabled ? customFeederName.trim() : feederName;
    if (!finalFeederName) {
      setFormError('Please specify or select a feeder station name.');
      return;
    }

    // Validate: Do not allow adding or updating an interruption to the same feeder if an active/unrestored log already exists
    const normFinal = normalizeFeederName(finalFeederName);
    const existingUnrestored = interruptions.find((item) => {
      if (editingItem && item.id === editingItem.id) return false;
      const isSameFeeder = normalizeFeederName(item.feederName) === normFinal;
      const isNotRestored = item.status !== InterruptionStatus.RESTORED;
      return isSameFeeder && isNotRestored;
    });

    if (existingUnrestored) {
      setFormError(`An active interruption log already exists for feeder "${finalFeederName}" (${existingUnrestored.status}). A new log cannot be created for this feeder until the existing issue is Restored.`);
      return;
    }
    
    if (!affectedArea.trim()) {
      setFormError('Please describe the affected community areas.');
      return;
    }

    if (!remark.trim()) {
      setFormError('Please provide a status or action log remark.');
      return;
    }

    const isFaultType = type === InterruptionType.EARTH_FAULT || 
                        type === InterruptionType.SHORT_CIRCUIT ||
                        type === InterruptionType.DIFFERENTIAL ||
                        type === InterruptionType.OVER_CURRENT;
    const finalEstimatedRestoration = isFaultType ? 'N/A' : estimatedRestoration;

    const finalDistrict = (isTeamLeader || userRole === 'team_leader')
      ? (currentTeamLeader?.district || district || 'Team D')
      : (district || INITIAL_DISTRICTS[0]);

    const payload = {
      feederName: finalFeederName,
      district: finalDistrict,
      type,
      status,
      startTime,
      estimatedRestorationTime: finalEstimatedRestoration,
      affectedArea: affectedArea.trim(),
      remark: remark.trim()
    };

    if (editingItem) {
      // Perform update
      onUpdateInterruption(editingItem.id, payload);
    } else {
      // Perform create
      onAddInterruption(payload);
    }

    setShowFormModal(false);
  };

  // Quick Resolve feeder toggler
  const handleQuickResolve = (item: FeederInterruption) => {
    const now = new Date();
    onUpdateInterruption(item.id, {
      status: InterruptionStatus.RESTORED,
      remark: `Restored: Power flow stable. verified active transmission grid. [Log updated at Admin Cabinet].`,
      estimatedRestorationTime: now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    });
  };

  // Export current interruption records as a CSV file for reporting
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Feeder Station Name',
      'District Region',
      'Interruption Cause / Type',
      'Operational Status',
      'Start Time',
      'Estimated Restoration Time',
      'Affected Location Area',
      'Action Log / Remarks',
      'Last Updated'
    ];

    const sortedInterruptionsForCSV = [...interruptions].sort((a, b) => {
      const aRestored = a.status === InterruptionStatus.RESTORED;
      const bRestored = b.status === InterruptionStatus.RESTORED;
      if (aRestored && !bRestored) return 1;
      if (!aRestored && bRestored) return -1;
      return 0;
    });

    const rows = sortedInterruptionsForCSV.map(item => [
      item.id,
      item.feederName,
      item.district,
      item.type,
      item.status,
      item.startTime,
      item.estimatedRestorationTime,
      // Replace target newlines with clean separator so it stays within the spreadsheet row
      String(item.affectedArea ?? '').replace(/[\r\n]+/g, ' | '),
      String(item.remark ?? '').replace(/[\r\n]+/g, ' | '),
      item.lastUpdated || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(value => {
          const stringified = String(value ?? '').trim();
          const escaped = stringified.replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
            return `"${escaped}"`;
          }
          return escaped;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for proper Excel UTF-8 encoding (especially for Amharic characters)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eeu_feeder_interruptions_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy current interruptions to clipboard formatted perfectly as TSV (Tab Separated Values)
  // This format pastes perfectly directly into Google Sheets or Excel with aligned rows/columns.
  const handleCopyCSV = () => {
    const headers = [
      'Ref ID',
      'Feeder Station Name',
      'District Region',
      'Interruption Cause / Type',
      'Operational Status',
      'Start Time',
      'Estimated Restoration Time',
      'Affected Location Area',
      'Action Log / Remarks',
      'Last Updated'
    ];

    const sortedInterruptionsForTSV = [...interruptions].sort((a, b) => {
      const aRestored = a.status === InterruptionStatus.RESTORED;
      const bRestored = b.status === InterruptionStatus.RESTORED;
      if (aRestored && !bRestored) return 1;
      if (!aRestored && bRestored) return -1;
      return 0;
    });

    const rows = sortedInterruptionsForTSV.map(item => [
      `f-${item.id}`,
      item.feederName,
      item.district,
      item.type,
      item.status,
      item.startTime,
      item.estimatedRestorationTime,
      // Replace any linebreaks inside cells with a clean '|' so they stay inside the column/cell
      String(item.affectedArea ?? '').trim().replace(/[\r\n]+/g, ' | '),
      String(item.remark ?? '').trim().replace(/[\r\n]+/g, ' | '),
      item.lastUpdated || ''
    ]);

    // Google Sheets and Excel interpret tab characters (\t) as cell gaps, and newlines (\r\n) as row gaps
    const clipboardContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(val => String(val ?? '').replace(/\t/g, ' ')).join('\t'))
    ].join('\r\n');

    navigator.clipboard.writeText(clipboardContent)
      .then(() => {
        setCsvCopied(true);
        setTimeout(() => setCsvCopied(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard', err);
      });
  };

  // Login view component if not authenticated as Admin or Team Leader
  if (!isAdmin && !isTeamLeader && userRole !== 'team_leader') {
    return (
      <div id="admin-login-view" className="max-w-md mx-auto my-12 p-8 glass-card rounded-3xl text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-eeu-yellow/20 dark:bg-eeu-yellow/5 border border-eeu-yellow/30 flex items-center justify-center mb-5">
            <Lock className="w-7 h-7 text-eeu-yellow font-bold" />
          </div>
          <h2 className="text-xl font-display font-black text-gray-900 dark:text-white mb-2">
            Admin Authentication Required
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Please enter your administrative authorization passcode PIN to add, modify, or remove grid feeder disruptions.
          </p>

          <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-left text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase font-mono tracking-wider">
                Authorized Passcode PIN
              </label>
              <input
                id="admin-pin-input"
                type="password"
                placeholder="••••"
                maxLength={8}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-bold rounded-xl glass-input p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eeu-green"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 bg-red-100/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Incorrect passcode PIN. Please try again!</span>
              </div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-3 bg-eeu-green hover:bg-eeu-green-hover text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-eeu-green/20"
            >
              Verify Credentials
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated State View
  const filteredFeeders = activeFeeders.filter((f) => {
    const { feederLine, amharicLocation } = parseFeeder(f);
    const query = feederSearchQuery.toLowerCase();
    const englishLocation = translateAmharicLocation(amharicLocation).toLowerCase();
    return (
      feederLine.toLowerCase().includes(query) ||
      amharicLocation.toLowerCase().includes(query) ||
      englishLocation.includes(query)
    );
  });

  return (
    <div id="admin-management-view" className="space-y-6">
      {/* Admin Action Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-gray-200 dark:border-gray-900">
        <div className="text-left">
          <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-eeu-green" />
            <span>Feeder Administration Panel</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Publish real-time interruption, manage available master feeder lines, or clear resolved areas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-export-csv-btn"
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-eeu-green/20 dark:border-eeu-green/35 text-eeu-green hover:bg-eeu-green/10 flex items-center gap-2 transition-all cursor-pointer"
            title="Export current interruptions as a CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="admin-copy-csv-btn"
            onClick={handleCopyCSV}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
              csvCopied 
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-blue-500/20 dark:border-blue-500/35 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
            }`}
            title="Copy interruptions formatted for direct pasting (Ctrl+V) into Google Sheets"
          >
            {csvCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{csvCopied ? 'Copied to Sheets!' : 'Copy to CSV'}</span>
          </button>


          
          {adminSubTab === 'outages' ? (
            <button
              id="admin-add-new-btn"
              onClick={handleOpenAddForm}
              className="px-4 py-2.5 bg-eeu-green hover:bg-eeu-green-hover text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-eeu-green/15 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Interruption</span>
            </button>
          ) : adminSubTab === 'feeders' ? (
            <div className="flex items-center gap-2">
              {onResetMasterFeeders && (
                <button
                  id="admin-preset-reset-btn"
                  onClick={() => {
                    if (window.confirm(`Sync and restore all ${INITIAL_FEEDERS_LIST.length} official EEU feeder line database records? This will update any outdated or missing feeder lines.`)) {
                      onResetMasterFeeders();
                    }
                  }}
                  className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title={`Force re-sync and restore the complete ${INITIAL_FEEDERS_LIST.length} master feeder line database to Database and local cache`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Sync Master Database ({INITIAL_FEEDERS_LIST.length})</span>
                </button>
              )}
              <button
                id="admin-preset-add-btn"
                onClick={handleOpenAddFeeder}
                className="px-4 py-2.5 bg-eeu-green hover:bg-eeu-green-hover active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-eeu-green/20 hover:shadow-eeu-green/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-eeu-green focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <Plus className="w-4 h-4" />
                <span>Add Feeder Preset</span>
              </button>
            </div>
          ) : (
            <button
              id="admin-tl-add-btn"
              onClick={handleOpenAddTL}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-sky-600/15 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Leader</span>
            </button>
          )}
        </div>
      </div>

      {/* Supabase RLS sync notice if detected */}
      {adminRlsNotice && (
        <div id="admin-supabase-rls-alert" className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-white">
                Supabase Row-Level Security (RLS) is blocking shared sync on table &quot;{adminRlsNotice.table}&quot;
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Outages you add will only save on this browser until you run the SQL script in your Supabase SQL Editor. Copy the 1-click SQL fix below:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyRlsSql}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-xs"
          >
            {adminCopiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{adminCopiedSql ? 'SQL Script Copied!' : 'Copy 1-Click SQL Fix'}</span>
          </button>
        </div>
      )}

      {/* Admin Panel Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800/60 gap-1 flex-wrap font-sans">
        <button
          id="admin-subtab-outages"
          onClick={() => setAdminSubTab('outages')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 font-sans ${
            adminSubTab === 'outages'
              ? 'border-eeu-green text-eeu-green'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="font-sans">Disruptions Board ({interruptions.length})</span>
        </button>
        <button
          id="admin-subtab-feeders"
          onClick={() => setAdminSubTab('feeders')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 font-sans ${
            adminSubTab === 'feeders'
              ? 'border-eeu-green text-eeu-green'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span className="font-sans">Preset Feeder Lines Database ({activeFeeders.length})</span>
        </button>
        {(isAdmin || userRole === 'admin') && (
          <button
            id="admin-subtab-team-leaders"
            onClick={() => setAdminSubTab('team_leaders')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 font-sans ${
              adminSubTab === 'team_leaders'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-sans">Team Leaders Accounts ({teamLeaders.length})</span>
          </button>
        )}
      </div>

      {/* Grid Interruption Direct List Control */}
      {adminSubTab === 'outages' && (
        <div className="glass-card rounded-2xl overflow-hidden font-sans">
        <div className="p-5 border-b border-gray-200/30 dark:border-gray-800/30 bg-transparent flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display font-medium text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            All Listed Feeder Disruptions ({interruptions.length})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-bold text-emerald-650 bg-emerald-500/10 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/25">
              Admin: Write Access Active
            </span>
            <span className="text-[10px] font-sans text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              Live Persistence
            </span>
          </div>
        </div>

        {interruptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-sans">
            <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-sm">No recorded feeder items found</p>
            <p className="text-xs text-gray-505 dark:text-gray-500 mt-1">
              Click "Add Interruption" above to create the first feeder log record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-sans font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-50/30 dark:bg-gray-950/10">
                  <th className="py-3.5 px-5 font-sans">Feeder Station Details</th>
                  <th className="py-3.5 px-5 font-sans">Type / Region</th>
                  <th className="py-3.5 px-5 font-sans">Operational Status</th>
                  <th className="py-3.5 px-5 font-sans">Affected Location Area</th>
                  <th className="py-3.5 px-5 text-right font-sans">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
                {[...interruptions].sort((a, b) => {
                  const aRestored = a.status === InterruptionStatus.RESTORED;
                  const bRestored = b.status === InterruptionStatus.RESTORED;
                  if (aRestored && !bRestored) return 1;
                  if (!aRestored && bRestored) return -1;
                  return 0;
                }).map((item) => {
                  const isRestored = item.status === InterruptionStatus.RESTORED;
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50/40 dark:hover:bg-gray-950/20 transition-all ${
                        isRestored ? 'bg-gray-50/20 dark:bg-gray-950/10 opacity-70' : ''
                      }`}
                    >
                      {/* Name & Sub details */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {stripBrackets(item.feederName)}
                        </div>
                        <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Started: {item.startTime}</span>
                        </div>
                      </td>

                      {/* Outage Type */}
                      <td className="py-4 px-5">
                        <div className="pb-1.5">
                          <InterruptionTypeBadge type={item.type} />
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>
                            {(() => {
                              const dir = getCardinalDirection(item.district, item.feederName);
                              return dir === 'Sheger' ? 'Sheger Region' : `${dir} Addis Ababa`;
                            })()}
                          </span>
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === InterruptionStatus.ACTIVE
                            ? 'bg-red-100/80 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                            : item.status === InterruptionStatus.UNDER_INVESTIGATION
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === InterruptionStatus.ACTIVE
                              ? 'bg-red-500 animate-pulse'
                              : item.status === InterruptionStatus.UNDER_INVESTIGATION
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-green-500'
                          }`} />
                          {item.status}
                        </span>
                        
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 font-medium italic mt-1 max-w-[180px] truncate" title={item.remark}>
                          {item.remark}
                        </div>
                      </td>

                      {/* Affected Area snippet */}
                      <td className="py-4 px-5">
                        <div className="text-xs text-gray-600 dark:text-gray-300 max-w-[220px] line-clamp-2">
                          {item.affectedArea}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isRestored && (
                            <button
                              id={`admin-resolve-btn-${item.id}`}
                              onClick={() => handleQuickResolve(item)}
                              title="Mark as Restored"
                              className="p-2 text-eeu-green hover:bg-eeu-green/10 rounded-lg transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            id={`admin-edit-btn-${item.id}`}
                            onClick={() => handleOpenEditForm(item)}
                            title="Edit Interruption Info"
                            className="p-2 text-blue-650 hover:bg-blue-500/10 dark:text-blue-400 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          <button
                            id={`admin-delete-btn-${item.id}`}
                            onClick={() => {
                              setDeleteConfirm({
                                idOrStr: item.id,
                                name: item.feederName,
                                type: 'interruption'
                              });
                            }}
                            title="Delete Record"
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Preset Feeder Lines Database Manager */}
      {adminSubTab === 'feeders' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-200/30 dark:border-gray-800/30 bg-transparent flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="text-left flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-semibold text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Preset Feeder Line Records Database ({activeFeeders.length})
                </h3>
                <span className="text-[10px] font-mono font-bold text-emerald-650 bg-emerald-500/10 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/25 animate-pulse">
                  Admin: Write Access Active
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Customize physical grid line naming templates and pre-populated community lists in both Amharic and English.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Language Selector for Presets (2 Languages: Amharic & English) */}
              <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold">
                <button
                  id="admin-lang-am-btn"
                  onClick={() => setFeederLangMode('am')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    feederLangMode === 'am'
                      ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                  title="Amharic Only"
                >
                  <span>አማርኛ</span>
                  <span className="text-[9px] opacity-75 font-mono">AM</span>
                </button>

                <button
                  id="admin-lang-en-btn"
                  onClick={() => setFeederLangMode('en')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    feederLangMode === 'en'
                      ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                  title="English Spelling"
                >
                  <span>English</span>
                  <span className="text-[9px] opacity-75 font-mono">EN</span>
                </button>
              </div>

              {/* In-table Search Input */}
              <div className="w-56">
                <input
                  id="feeder-search-input"
                  type="text"
                  placeholder="Search preset feeders..."
                  value={feederSearchQuery}
                  onChange={(e) => setFeederSearchQuery(e.target.value)}
                  className="w-full text-xs rounded-xl glass-input px-3.5 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green"
                />
              </div>
            </div>
          </div>

          {filteredFeeders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-sm">No matching feeder lines found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try revising your query or click "Add Feeder Preset" at the top to register a new line.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-sans font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-50/30 dark:bg-gray-950/10">
                    <th className="py-3.5 px-5 w-1/5 font-sans">Feeder Name</th>
                    <th className="py-3.5 px-5 w-1/5 font-sans">Feeder Number</th>
                    <th className="py-3.5 px-5 font-sans">
                      <div className="flex items-center justify-between">
                        <span>Affected Areas</span>
                        <span className="text-[9px] font-mono text-eeu-green normal-case font-bold">
                          {feederLangMode === 'en' ? 'English Only' : 'አማርኛ Only'}
                        </span>
                      </div>
                    </th>
                    <th className="py-3.5 px-5 text-right w-28 font-sans">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
                  {filteredFeeders.map((feederStr, index) => {
                    const { feederLine, amharicLocation } = parseFeeder(feederStr);
                    const { substation, feederId } = parseFeederDetails(feederLine);
                    const englishLocation = translateAmharicLocation(amharicLocation);
                    return (
                      <tr 
                        key={`${feederStr}-${index}`} 
                        className="hover:bg-gray-50/40 dark:hover:bg-gray-950/20 transition-all font-sans"
                      >
                        {/* Substation */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-left">
                            <Building className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 shrink-0" />
                            <span>{substation}</span>
                          </div>
                        </td>

                        {/* Identifier */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-left">
                            <Zap className="w-3.5 h-3.5 text-eeu-yellow fill-eeu-yellow/10 shrink-0" />
                            <span>{feederId}</span>
                          </div>
                        </td>

                        {/* Language formatted Default Location area */}
                        <td className="py-4 px-5">
                          {!amharicLocation ? (
                            <span className="text-gray-400 italic font-mono text-[11px]">[No default community mapped]</span>
                          ) : feederLangMode === 'en' ? (
                            <div className="text-xs text-gray-800 dark:text-gray-200 text-left leading-relaxed font-medium">
                              {englishLocation}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-800 dark:text-gray-200 text-left leading-relaxed">
                              {amharicLocation}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`feeder-edit-btn-${index}`}
                              onClick={() => handleOpenEditFeeder(feederStr, index)}
                              title="Edit Preset"
                              className="p-2 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            <button
                              id={`feeder-delete-btn-${index}`}
                              onClick={() => {
                                setDeleteConfirm({
                                  idOrStr: feederStr,
                                  name: feederLine,
                                  type: 'feeder'
                                });
                              }}
                              title="Delete Area Preset"
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Team Leaders User Management View (Admin Only) */}
      {adminSubTab === 'team_leaders' && (isAdmin || userRole === 'admin') && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-200/30 dark:border-gray-800/30 bg-transparent flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-medium text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-500" />
                <span>Team Leader User Accounts & Credentials</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only Admin can create, edit, or manage usernames and passwords for Team Leaders.
              </p>
            </div>
            <button
              onClick={handleOpenAddTL}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-sky-600/15 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Leader Account</span>
            </button>
          </div>

          {teamLeaders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <Users className="w-8 h-8 mx-auto text-sky-500/60" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Team Leader Accounts Created Yet</p>
              <p className="text-xs text-gray-500">Click "Add Team Leader Account" above to create credentials for team leaders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200/40 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/40 text-gray-500 uppercase tracking-wider text-[10px] font-sans">
                    <th className="py-3 px-4 font-semibold font-sans">Team Leader Name</th>
                    <th className="py-3 px-4 font-semibold font-sans">Team</th>
                    <th className="py-3 px-4 font-semibold font-sans">Username</th>
                    <th className="py-3 px-4 font-semibold font-sans">Password</th>
                    <th className="py-3 px-4 font-semibold font-sans">Role Permissions</th>
                    <th className="py-3 px-4 font-semibold text-right font-sans">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-gray-800/30 font-sans">
                  {teamLeaders.map((tl) => {
                    const isPassVisible = visibleTLPasswords[tl.id] || false;
                    return (
                      <tr key={tl.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2 font-sans">
                          <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-sans">{tl.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 font-medium">
                          {tl.district || 'Team A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                          {tl.username}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-semibold text-xs tracking-wider">
                              {isPassVisible ? tl.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleTLPasswordVisibility(tl.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                              title={isPassVisible ? "Hide password" : "Show password"}
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${tl.role === 'admin' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : tl.role === 'agent' ? 'bg-gray-500/10 text-gray-600 border-gray-500/20' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'}`}>
                            <Shield className="w-3 h-3" />
                            <span className="capitalize">{tl.role ? tl.role.replace('_', ' ') : 'Team Leader'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditTL(tl)}
                              className="p-2 text-sky-600 hover:bg-sky-500/10 dark:text-sky-400 rounded-lg transition-all cursor-pointer"
                              title="Edit Credentials"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  idOrStr: tl.id,
                                  name: `${tl.name} (${tl.username})`,
                                  type: 'team_leader'
                                });
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                              title="Delete Team Leader Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modern Pop-up / Overlay Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-250/30 dark:border-gray-800/30 flex items-center justify-between bg-transparent">
              <div>
                <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white">
                  {editingItem ? 'Modify Interruption Log' : 'Create Feeder Interruption Log'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ensure strict precision for Call Center updates.
                </p>
              </div>
              <button
                id="form-close-btn"
                onClick={() => setShowFormModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {adminRlsNotice && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 dark:text-white">
                        Database Sync Blocked: Supabase RLS is active on &quot;{adminRlsNotice.table}&quot;
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
                        This outage will save to this browser only until you run the SQL fix in Supabase.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyRlsSql}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs text-xs"
                  >
                    {adminCopiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{adminCopiedSql ? 'SQL Copied!' : 'Copy 1-Click SQL'}</span>
                  </button>
                </div>
              )}

              {formError && (
                <div className="p-4 bg-red-100/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Feeder selector or custom builder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                    Feeder Station Selection
                  </label>
                  {!customFeederEnabled ? (
                    <div className="relative space-y-1.5">
                      {formFeederDropdownOpen && (
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setFormFeederDropdownOpen(false)} 
                        />
                      )}
                      <div className="relative z-50">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="form-feeder-select"
                          type="text"
                          placeholder={feederName ? `Selected: ${feederName} — type to change...` : "Search feeder code, substation or area (e.g. ADC-11, 22)..."}
                          value={formFeederSearchQuery}
                          onFocus={(e) => {
                            setFormFeederDropdownOpen(true);
                            e.target.select();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormFeederSearchQuery(val);
                            setFormFeederDropdownOpen(true);

                            const q = val.trim().toLowerCase();
                            if (q) {
                              const exactMatch = activeFeeders.find((f) => {
                                const parsed = parseFeeder(f);
                                return parsed.feederLine.toLowerCase() === q;
                              });
                              const match = exactMatch || activeFeeders.find((f) => {
                                const parsed = parseFeeder(f);
                                return (
                                  parsed.feederLine.toLowerCase().includes(q) ||
                                  parsed.amharicLocation.toLowerCase().includes(q) ||
                                  f.toLowerCase().includes(q)
                                );
                              });
                              if (match) {
                                const parsed = parseFeeder(match);
                                setFeederName(parsed.feederLine);
                                if (parsed.amharicLocation) {
                                  setAffectedArea(parsed.amharicLocation);
                                }
                              }
                            }
                          }}
                          className="w-full text-xs rounded-xl glass-input pl-9 pr-8 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eeu-green/40 focus:border-eeu-green bg-white dark:bg-gray-950 font-medium transition-all shadow-sm border border-gray-200 dark:border-gray-800"
                        />
                        {formFeederSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormFeederSearchQuery('');
                              setFormFeederDropdownOpen(true);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {feederName && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-semibold truncate">Active Selection: {feederName}</span>
                        </div>
                      )}

                      {/* Dropdown Options */}
                      {formFeederDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl divide-y divide-gray-100 dark:divide-gray-800/50">
                          {(() => {
                            const query = formFeederSearchQuery.trim().toLowerCase();
                            const matches = activeFeeders.filter((feeder) => {
                              const parsed = parseFeeder(feeder);
                              if (!query) return true;
                              return (
                                parsed.feederLine.toLowerCase().includes(query) ||
                                parsed.amharicLocation.toLowerCase().includes(query) ||
                                feeder.toLowerCase().includes(query)
                              );
                            });

                            if (matches.length === 0) {
                              return (
                                <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                  No feeders match &quot;{formFeederSearchQuery}&quot;
                                </div>
                              );
                            }

                            return matches.map((feeder) => {
                              const parsed = parseFeeder(feeder);
                              const norm = normalizeFeederName(parsed.feederLine);
                              const activeItem = interruptions.find(
                                (item) =>
                                  (!editingItem || item.id !== editingItem.id) &&
                                  normalizeFeederName(item.feederName) === norm &&
                                  item.status !== InterruptionStatus.RESTORED
                              );
                              const isSelected = feederName === parsed.feederLine;

                              return (
                                <button
                                  key={feeder}
                                  type="button"
                                  disabled={!!activeItem}
                                  onClick={() => {
                                    setFeederName(parsed.feederLine);
                                    setFormFeederSearchQuery(parsed.feederLine);
                                    setFormFeederDropdownOpen(false);

                                    // Auto fill Affected Communities / Areas
                                    setAffectedArea(parsed.amharicLocation);
                                  }}
                                  className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-eeu-green/10 text-eeu-green font-semibold'
                                      : activeItem
                                      ? 'bg-gray-50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                                  }`}
                                >
                                  <div className="truncate">
                                    <div className="font-semibold">{parsed.feederLine}</div>
                                    {parsed.amharicLocation && (
                                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                        {parsed.amharicLocation}
                                      </div>
                                    )}
                                  </div>
                                  {activeItem && (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">
                                      ⚠️ Outage Active
                                    </span>
                                  )}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        id="form-feeder-custom-input"
                        type="text"
                        placeholder="e.g. Merkato Main Substation - Feeder 08"
                        value={customFeederName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFeederName(val);
                        }}
                        className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1.5 focus:ring-eeu-green"
                      />
                      <button
                        id="form-toggle-custom-off"
                        type="button"
                        onClick={() => setCustomFeederEnabled(false)}
                        className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block text-left"
                      >
                        Choose from existing preset list
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider">
                      Administrative Team Leader
                    </label>
                  </div>
                  {isTeamLeader || userRole === 'team_leader' ? (
                    <select
                      id="form-district-select"
                      value={currentTeamLeader?.district || district || 'Team D'}
                      disabled
                      aria-readonly="true"
                      className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white font-semibold cursor-not-allowed opacity-90"
                    >
                      <option value={currentTeamLeader?.district || district || 'Team D'}>
                        {currentTeamLeader?.district || district || 'Team D'} {currentTeamLeader?.name ? `— ${currentTeamLeader.name}` : ''}
                      </option>
                    </select>
                  ) : (
                    <select
                      id="form-district-select"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green"
                    >
                      {INITIAL_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Type and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                    Interruption Cause Type
                  </label>
                  <select
                    id="form-type-select"
                    value={type}
                    onChange={(e) => setType(e.target.value as InterruptionType)}
                    className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green"
                  >
                    {Object.values(InterruptionType).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                    Current Restoration Status
                  </label>
                  <select
                    id="form-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InterruptionStatus)}
                    className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green"
                  >
                    {Object.values(InterruptionStatus).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={(type === InterruptionType.EARTH_FAULT || type === InterruptionType.SHORT_CIRCUIT || type === InterruptionType.DIFFERENTIAL || type === InterruptionType.OVER_CURRENT) ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                    Interruption Start Time
                  </label>
                  <input
                    id="form-startTime-input"
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. Jun 19, 08:30 AM"
                    className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green"
                  />
                </div>

                {type !== InterruptionType.EARTH_FAULT && type !== InterruptionType.SHORT_CIRCUIT && type !== InterruptionType.DIFFERENTIAL && type !== InterruptionType.OVER_CURRENT && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                      Estimated Restoration Time
                    </label>
                    <input
                      id="form-estimRestor-input"
                      type="text"
                      value={estimatedRestoration}
                      onChange={(e) => setEstimatedRestoration(e.target.value)}
                      placeholder="e.g. Jun 19, 11:30 AM"
                      className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green"
                    />
                  </div>
                )}
              </div>

              {/* Affected Areas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider">
                    Affected Communities & Landmark Areas
                  </label>
                  {affectedArea && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      Auto-Bilingual Support Active
                    </span>
                  )}
                </div>
                <textarea
                  id="form-affected-textarea"
                  rows={2}
                  value={affectedArea}
                  onChange={(e) => setAffectedArea(e.target.value)}
                  placeholder="List neighborhoods, landmark buildings, or streets disconnected (in Amharic or English, separated by commas)"
                  className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green leading-relaxed text-left"
                />
                {affectedArea && (
                  <div className="mt-1.5 p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl text-left">
                    <div className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                      English Spelling Preview:
                    </div>
                    <div className="text-[11.5px] text-emerald-900 dark:text-emerald-200 font-medium">
                      {translateAmharicLocation(affectedArea)}
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks/Actions Taken */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                  Technical Remarks & Action Dispatch Log
                </label>
                <textarea
                  id="form-remark-textarea"
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Crew instructions, breakdown details, or maintenance logs"
                  className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green leading-relaxed text-left"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50/20 dark:bg-gray-950/10">
                <button
                  id="form-cancel-btn"
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  id="form-submit-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-eeu-green hover:bg-eeu-green-hover text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-eeu-green/15"
                >
                  {editingItem ? 'Save Updates' : 'Add to Grid Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preset Feeder Line Modal */}
      {showFeederModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-transparent">
              <div>
                <h3 className="text-base font-display font-semibold text-gray-900 dark:text-white">
                  {editingFeederIdx !== null ? 'Modify Preset Feeder Line' : 'Add Preset Feeder Line'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update default settings for grid line mapping.
                </p>
              </div>
              <button
                id="feeder-modal-close-btn"
                onClick={() => setShowFeederModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFeederFormSubmit} className="p-6 space-y-4">
              {feederFormError && (
                <div className="p-4 bg-red-100/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feederFormError}</span>
                </div>
              )}

              {/* Separated Feeder Name & Feeder Number Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                    Feeder Name
                  </label>
                  <input
                    id="feeder-form-substation-input"
                    type="text"
                    required
                    value={feederFormSubstation}
                    onChange={(e) => setFeederFormSubstation(e.target.value)}
                    placeholder="e.g. ADDIS CENTER"
                    className="w-full text-xs rounded-xl glass-input px-3.5 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green text-left font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-1.5">
                    Feeder Number
                  </label>
                  <input
                    id="feeder-form-code-input"
                    type="text"
                    required
                    value={feederFormCode}
                    onChange={(e) => setFeederFormCode(e.target.value)}
                    placeholder="e.g. ADC-04"
                    className="w-full text-xs rounded-xl glass-input px-3.5 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green text-left font-semibold"
                  />
                </div>
              </div>

              {/* Default communities field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider">
                    Affected Areas (Amharic/English)
                  </label>
                  {feederFormArea && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      Auto-Bilingual Support Active
                    </span>
                  )}
                </div>
                <textarea
                  id="feeder-form-area-textarea"
                  rows={4}
                  value={feederFormArea}
                  onChange={(e) => setFeederFormArea(e.target.value)}
                  placeholder="Insert affected neighborhoods or landmarks in Amharic or English separated by commas (e.g. ቃሊቲ፥ ቆሼ፥ ገላን ወረዳ)"
                  className="w-full text-xs rounded-xl glass-input p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green leading-relaxed text-left font-medium"
                />
                {feederFormArea && (
                  <div className="mt-1.5 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl text-left">
                    <div className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                      English Spelling Preview:
                    </div>
                    <div className="text-[11.5px] text-emerald-900 dark:text-emerald-200 font-medium">
                      {translateAmharicLocation(feederFormArea)}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-150/30 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50/20 dark:bg-gray-950/10">
                <button
                  id="feeder-form-cancel-btn"
                  type="button"
                  onClick={() => setShowFeederModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="feeder-form-submit-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-eeu-green hover:bg-eeu-green-hover text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-eeu-green/15 cursor-pointer"
                >
                  {editingFeederIdx !== null ? 'Save Changes' : 'Register Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Leader Account Modal */}
      {showTLModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="p-5 border-b border-gray-200/30 dark:border-gray-800/30 flex items-center justify-between bg-sky-500/5">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-500" />
                <h3 className="text-base font-display font-semibold text-gray-900 dark:text-white">
                  {editingTL ? 'Edit Team Leader Account' : 'Create Team Leader Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTLModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTL} className="p-5 space-y-4 text-left">
              {tlFormError && (
                <div className="p-3 bg-red-100/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{tlFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Team Leader Name / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Call Center Team Leader"
                  value={tlName}
                  onChange={(e) => setTlName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Call Center Shift Team / Region Assignment
                </label>
                <select
                  value={tlDistrict}
                  onChange={(e) => setTlDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  {INITIAL_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  System Role
                </label>
                <select
                  value={tlRole}
                  onChange={(e) => setTlRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="team_leader">Team Leader (Manage Outages)</option>
                  <option value="admin">Administrator (Manage Users & Outages)</option>
                  <option value="agent">Agent (View Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Username</span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">Unique Account ID</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. team_a or teamleader"
                  value={tlUsername}
                  onChange={(e) => setTlUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="text"
                  placeholder="e.g., Tl@1234"
                  value={tlPassword}
                  onChange={(e) => setTlPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-800 dark:text-sky-300">
                <strong>Role Authority:</strong> Team leaders can log in with these credentials to record feeder interruptions, while username and password management is exclusively restricted to the Admin.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTLModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Team Leader Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation / Deletion Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h4 className="font-display font-semibold text-gray-950 dark:text-white">Confirm Deletion</h4>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              Are you absolutely sure you want to delete <strong className="text-gray-900 dark:text-white font-semibold">"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                id="delete-confirm-cancel-btn"
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="delete-confirm-btn"
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'interruption') {
                    onDeleteInterruption(deleteConfirm.idOrStr);
                  } else if (deleteConfirm.type === 'feeder') {
                    handleDeleteFeeder(deleteConfirm.idOrStr);
                  } else if (deleteConfirm.type === 'team_leader' && onDeleteTeamLeader) {
                    onDeleteTeamLeader(deleteConfirm.idOrStr);
                  }
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold font-sans tracking-wide transition-all shadow-md shadow-red-500/20 cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
