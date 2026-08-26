import React from 'react';
import { ShieldAlert, Zap, CalendarClock } from 'lucide-react';
import { FeederInterruption, InterruptionType, InterruptionStatus } from '../types';
import { EarthFaultIcon } from './AgentView';

interface StatsGridProps {
  interruptions: FeederInterruption[];
}

export default function StatsGrid({ interruptions }: StatsGridProps) {
  // Compute metrics dynamically
  const activeCount = interruptions.filter(i => i.status !== InterruptionStatus.RESTORED).length;
  
  const earthFaults = interruptions.filter(
    i => i.status !== InterruptionStatus.RESTORED && i.type === InterruptionType.EARTH_FAULT
  ).length;

  const shortCircuits = interruptions.filter(
    i => i.status !== InterruptionStatus.RESTORED && i.type === InterruptionType.SHORT_CIRCUIT
  ).length;

  const planned = interruptions.filter(
    i => i.status !== InterruptionStatus.RESTORED && (i.type === InterruptionType.PLANNED_INTERRUPTION || i.type === InterruptionType.OPERATIONAL_INTERRUPTION)
  ).length;

  const statCards = [
    {
      id: "stat-total-active",
      title: "Active Outages",
      value: activeCount,
      textColor: "text-rose-600 dark:text-rose-400 font-bold",
      subtext: "Immediate dispatch team alerted",
      icon: ShieldAlert,
      iconBg: "bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/40 shadow-xs",
      iconColor: "text-rose-600 dark:text-rose-400",
      indicator: "right now"
    },
    {
      id: "stat-earth-fault",
      title: "Earth Faults",
      value: earthFaults,
      textColor: "text-amber-600 dark:text-amber-400 font-bold",
      subtext: "Ground patrols dispatched",
      icon: EarthFaultIcon,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 shadow-xs",
      iconColor: "text-amber-600 dark:text-amber-400",
      indicator: "right now"
    },
    {
      id: "stat-short-circuit",
      title: "Short Circuit",
      value: shortCircuits,
      textColor: "text-orange-600 dark:text-orange-400 font-bold",
      subtext: "Phase-to-phase contact",
      icon: Zap,
      iconBg: "bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-900/40 shadow-xs",
      iconColor: "text-orange-600 dark:text-orange-400",
      indicator: "right now"
    },
    {
      id: "stat-planned",
      title: "Planned & OPERATIONAL",
      value: planned,
      textColor: "text-sky-600 dark:text-sky-400 font-bold",
      subtext: "Pre-notified clients",
      icon: CalendarClock,
      iconBg: "bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-900/40 shadow-xs",
      iconColor: "text-sky-600 dark:text-sky-400",
      indicator: "right now"
    }
  ];

  return (
    <div id="statistics-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            id={card.id}
            key={card.id}
            className="p-5 rounded-2xl glass-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-display font-semibold tracking-tight ${card.textColor}`}>
                  {card.value}
                </span>
                <span className="text-xs font-sans font-bold uppercase py-0.5 px-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300">
                  {card.indicator}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
