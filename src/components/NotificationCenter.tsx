import React from 'react';
import { Bell, Check, AppWindow, Zap, Info, ShieldAlert, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { SystemNotification, FeederInterruption, InterruptionStatus, stripBrackets } from '../types';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onMarkAllAsRead: () => void;
  onMarkOneAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
  // Let's pass interruptions to list "Recently Updated Feeders"
  interruptions: FeederInterruption[];
}

export default function NotificationCenter({
  notifications,
  onMarkAllAsRead,
  onMarkOneAsRead,
  onClearAllNotifications,
  interruptions
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter 5 most recently updated feeders
  const recentlyUpdatedFeeders = [...interruptions]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 5);

  return (
    <div id="notification-center-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Notifications Log (left 2/3 cols) */}
      <div className="lg:col-span-2 glass-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-eeu-green/10 text-eeu-green">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white">
                Notification Of Feeders Interruption And Feeders Restored
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="noti-mark-read-all-btn"
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-eeu-green hover:underline cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
            
            <span>&bull;</span>
            
            <button
              id="noti-clear-all-btn"
              onClick={onClearAllNotifications}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 font-medium cursor-pointer"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <History className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-sm">Clear operational boards</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Interruption telemetry reports is waiting for updates.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {notifications.map((noti) => {
              // Icon style mappings
              let icon = <Info className="w-4 h-4 text-blue-500" />;
              let badgeColor = 'bg-blue-500/10 border-blue-200 text-blue-500';
              
              if (noti.type === 'new') {
                icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
                badgeColor = 'bg-red-500/10 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400';
              } else if (noti.type === 'resolve') {
                icon = <CheckCircle2 className="w-4 h-4 text-eeu-green" />;
                badgeColor = 'bg-eeu-green/10 border-eeu-green/20 text-eeu-green';
              } else if (noti.type === 'update') {
                icon = <ShieldAlert className="w-4 h-4 text-amber-500" />;
                badgeColor = 'bg-amber-500/10 border-amber-200 text-amber-600 dark:text-amber-400';
              }

              return (
                <div
                  id={`noti-item-${noti.id}`}
                  key={noti.id}
                  onClick={() => onMarkOneAsRead(noti.id)}
                  className={`p-4 rounded-2xl glass-card flex items-start gap-3.5 cursor-pointer ${
                    noti.read 
                      ? 'opacity-60 border-gray-200/30' 
                      : 'ring-1 ring-eeu-green/10 border-eeu-green/30'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 ${badgeColor}`}>
                    {icon}
                  </div>

                  <div className="flex-1 space-y-1 text-left">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                        <span>
                          {noti.type === 'new' || noti.title === 'New Grid Warning Added' 
                            ? 'New Feeder Added' 
                            : (noti.type === 'resolve' || noti.title === 'Feeder Line Cleared' || noti.title === 'Feeder Restored Successfully' 
                              ? 'Feeder Line Restored' 
                              : noti.title)}
                        </span>
                        {!noti.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block animate-ping" />
                        )}
                      </h4>
                      <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                        {noti.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal">
                      {noti.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Updated Feeders Sidebar (Right 1/3 col) */}
      <div id="recent-updates-panel" className="glass-card rounded-3xl p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white">
            Recently Updated Feeders
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time activity audit sequence in 24h cycle.
          </p>
        </div>

        <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-850">
          {recentlyUpdatedFeeders.map((feeder, idx) => {
            const isResolved = feeder.status === InterruptionStatus.RESTORED;
            return (
              <div
                id={`recent-updated-${feeder.id}`}
                key={feeder.id}
                className={`pt-3 flex gap-3 text-left ${idx === 0 ? 'pt-0 border-none' : ''}`}
                title={`Last updated: ${feeder.lastUpdated}`}
              >
                {/* Visual marker */}
                <div className="relative flex flex-col items-center">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-905 flex items-center justify-center ${
                    isResolved 
                      ? 'bg-eeu-green' 
                      : feeder.status === InterruptionStatus.UNDER_INVESTIGATION 
                      ? 'bg-amber-500' 
                      : 'bg-red-500'
                  }`}>
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                  <div className="w-[1.5px] flex-1 bg-gray-200 dark:bg-gray-800 mt-1 min-h-[40px]" />
                </div>

                <div className="flex-1 space-y-1 pb-1">
                  <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500">
                    <span>{feeder.district}</span>
                    <span>{feeder.lastUpdated}</span>
                  </div>
                  
                  <h4 className="font-semibold text-xs text-gray-900 dark:text-white leading-tight">
                    {stripBrackets(feeder.feederName)}
                  </h4>
                  
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-normal line-clamp-2">
                    {feeder.remark}
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 rounded-md font-mono font-bold uppercase ${
                      isResolved 
                        ? 'bg-green-100 dark:bg-green-950/20 text-eeu-green' 
                        : 'bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                    }`}>
                      {feeder.status}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      Reason: {feeder.type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
