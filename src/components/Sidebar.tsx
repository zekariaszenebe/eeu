import React from 'react';
import { LayoutDashboard, ShieldAlert, Bell, History, Zap, User, AlertTriangle, ChevronLeft, ChevronRight, LogOut, MapPin, Phone, Calculator, Gauge, Headset, ShieldCheck, UserCheck, FileSpreadsheet } from 'lucide-react';
import EEULogo from './EEULogo';
import { UserRole, TeamLeaderUser } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  userRole?: UserRole;
  isTeamLeader?: boolean;
  currentTeamLeader?: TeamLeaderUser | null;
  onLogoutAdmin: () => void;
  onLogoutWeb: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  notificationCount: number;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  isAdmin,
  userRole = 'agent',
  isTeamLeader = false,
  currentTeamLeader,
  onLogoutAdmin,
  onLogoutWeb,
  isDarkMode,
  toggleTheme,
  notificationCount,
  isMinimized,
  onToggleMinimize
}: SidebarProps) {
  interface NavItem {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    badge?: string | null;
    badgeCount?: number;
  }

  const canManageFeed = isAdmin || isTeamLeader || userRole === 'team_leader' || userRole === 'admin';
  const feedTabName = isAdmin ? 'Admin Feed Control' : 'Add Interruption Feed';

  const navItems: NavItem[] = [
    { id: 'dashboard', name: 'Interruption Dashboard', icon: LayoutDashboard },
    ...(canManageFeed ? [{ id: 'admin', name: feedTabName, icon: ShieldAlert }] : []),
    { id: 'history', name: 'Restored Feeders', icon: History },
    { id: 'calculator', name: 'Bill Calculator', icon: Calculator },
    { id: 'smartmeter', name: 'Smart Meter Calculator', icon: Gauge },
    { id: 'tariff', name: 'EEU Bill Tarrif', icon: FileSpreadsheet },
    { id: 'hub', name: 'CSC Address', icon: MapPin },
    { id: 'contacts', name: 'Other Region Phone NO', icon: Phone }
  ];

  return (
    <aside className={`max-lg:hidden flex flex-col h-screen fixed top-0 left-0 glass-card rounded-none border-t-0 border-b-0 border-l-0 border-r border-gray-200/50 dark:border-gray-900/50 z-30 transition-all duration-300 shadow-none ${isMinimized ? 'w-20' : 'w-68'}`}>
      {/* Brand Header */}
      <div className={`p-5 border-b border-gray-200/40 dark:border-gray-900/40 flex flex-col gap-2 relative ${isMinimized ? 'items-center' : ''}`}>
        <div className="flex items-center justify-between w-full">
          <EEULogo showText={!isMinimized} textPosition="right" size={38} />
          {!isMinimized && (
            <button
              onClick={onToggleMinimize}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isMinimized && (
          <button
            onClick={onToggleMinimize}
            className="mt-1 p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}


      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 p-4 space-y-1.5 overflow-y-auto ${isMinimized ? 'px-2' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              id={`nav-tab-${item.id}`}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`relative w-full flex items-center transition-all ${
                isMinimized ? 'justify-center p-2 rounded-xl' : 'justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium'
              } ${
                isActive
                  ? 'bg-eeu-green text-white shadow-lg shadow-eeu-green/15 dark:shadow-eeu-green/5'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isMinimized ? item.name : undefined}
            >
              <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-eeu-yellow' : 'text-gray-400 dark:text-gray-500'}`} />
                {!isMinimized && <span>{item.name}</span>}
              </div>
              
              {!isMinimized && item.badge && (
                <span className="text-[9px] px-2 py-0.5 rounded-md font-bold font-mono bg-eeu-yellow/20 text-eeu-yellow border border-eeu-yellow/30">
                  {item.badge}
                </span>
              )}
              
              {item.badgeCount && item.badgeCount > 0 ? (
                isMinimized ? (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                    {item.badgeCount}
                  </span>
                ) : (
                  <span className="h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {item.badgeCount}
                  </span>
                )
              ) : null}

              {isMinimized && item.badge && (
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-eeu-yellow border border-white dark:border-black" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section & Admin Status */}
      <div className={`p-4 border-t border-gray-200/40 dark:border-gray-900/40 bg-transparent flex flex-col ${isMinimized ? 'px-2 items-center gap-3' : 'gap-3'}`}>
        {/* User Profile Pill Card */}
        {isMinimized ? (
          <div 
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-gray-200/80 dark:border-gray-800 shadow-sm ${
              isAdmin 
                ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' 
                : isTeamLeader 
                ? 'bg-sky-500/15 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                : 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}
            title={isAdmin ? 'Admin Profile' : isTeamLeader ? 'Team Leader (Role: Add Interruption)' : 'Call Center Profile'}
          >
            {isAdmin ? <ShieldCheck className="w-4.5 h-4.5" /> : isTeamLeader ? <UserCheck className="w-4.5 h-4.5" /> : <Headset className="w-4.5 h-4.5" />}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-1.5 pr-4 pl-2 bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/70 dark:border-gray-800/80 rounded-full select-none shadow-sm">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isAdmin 
                ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' 
                : isTeamLeader
                ? 'bg-sky-500/15 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                : 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4.5 h-4.5" /> : isTeamLeader ? <UserCheck className="w-4.5 h-4.5" /> : <Headset className="w-4.5 h-4.5" />}
            </div>
            <div className="flex flex-col text-left leading-tight overflow-hidden">
              <span className="text-[13px] font-bold text-gray-950 dark:text-white font-sans truncate">
                {isAdmin ? 'Admin' : isTeamLeader ? (currentTeamLeader?.name || 'Team Leader') : 'Call Agent'}
              </span>
            </div>
          </div>
        )}

        {/* Global Website Sign-out */}
        {isMinimized ? (
          <button
            id="sidebar-min-web-logout"
            onClick={onLogoutWeb}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
            title="Sign Out Website"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="sidebar-web-logout-btn"
            onClick={onLogoutWeb}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-650 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-900/20 hover:bg-red-50/50 dark:hover:bg-red-950/20 border border-gray-200 dark:border-gray-800/60 hover:border-red-200/50 dark:hover:border-red-950/20 rounded-xl transition-all font-sans cursor-pointer shadow-sm"
            title="Sign out of operators workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT PORTAL</span>
          </button>
        )}
      </div>
    </aside>
  );
}
