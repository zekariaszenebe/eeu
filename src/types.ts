export enum InterruptionType {
  EARTH_FAULT = 'Earth Fault',
  SHORT_CIRCUIT = 'Short Circuit',
  PLANNED_INTERRUPTION = 'Planned Interruption',
  OPERATIONAL_INTERRUPTION = 'Operational Interruption',
  DIFFERENTIAL = 'Differential',
  OVER_CURRENT = 'Over Current'
}

export enum InterruptionStatus {
  ACTIVE = 'Active',
  UNDER_INVESTIGATION = 'Partially Connected',
  RESTORED = 'Restored'
}

export type CardinalDirection = 'North' | 'East' | 'West' | 'South' | 'Sheger';

export interface FeederInterruption {
  id: string;
  feederName: string;
  district: string;
  direction?: CardinalDirection;
  type: InterruptionType;
  status: InterruptionStatus;
  startTime: string; // ISO string or simple time format
  estimatedRestorationTime: string; // Simple time or ISO string
  affectedArea: string;
  remark: string;
  lastUpdated: string;
}

export interface SystemNotification {
  id: string;
  feederId?: string;
  type: 'new' | 'update' | 'resolve' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SystemStats {
  totalActive: number;
  earthFaultCount: number;
  shortCircuitCount: number;
  plannedCount: number;
  restoredTodayCount: number;
}

export interface TeamLeaderNote {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  isUrgent: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  category: 'head_regional' | 'sheger_city' | 'regional_hotline';
  locationInfo?: string;
  hotlineShortCode?: string;
}

export interface TeamLeaderUser {
  id: string;
  username: string;
  password: string;
  name: string;
  district?: string;
  role?: UserRole;
  mustChangePassword?: boolean;
  createdAt: string;
}

export type UserRole = 'admin' | 'team_leader' | 'agent';

export function stripBrackets(name: string | undefined): string {
  if (!name) return '';
  return name.replace(/\s*\(.*?\)/g, '').trim();
}

