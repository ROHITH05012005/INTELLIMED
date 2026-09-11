// ============================================================
// INTELLIMED — Application Constants
// ============================================================

import type { UserRole } from '@/types';

// ─── Routes ──────────────────────────────────────────────────
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  MEDICATIONS: '/medications',
  MEDICATION_DETAIL: '/medications/:id',
  MEDICATION_NEW: '/medications/new',
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',
  ADHERENCE: '/adherence',
  ALERTS: '/alerts',
  DEVICE: '/device',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

// ─── Navigation by Role ───────────────────────────────────────
export const NAV_BY_ROLE: Record<UserRole, { label: string; path: string; icon: string }[]> = {
  patient: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'My Medications', path: '/medications', icon: 'Pill' },
    { label: "Today's Schedule", path: '/medications?tab=today', icon: 'Calendar' },
    { label: 'Medication History', path: '/medications?tab=history', icon: 'ClipboardList' },
    { label: 'My Adherence', path: '/adherence', icon: 'TrendingUp' },
    { label: 'Device', path: '/device', icon: 'Cpu' },
    { label: 'Profile', path: '/profile', icon: 'User' },
    { label: 'Settings', path: '/settings', icon: 'Settings' },
  ],
  caregiver: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Patients', path: '/patients', icon: 'Users' },
    { label: 'Medications', path: '/medications', icon: 'Pill' },
    { label: 'Adherence', path: '/adherence', icon: 'TrendingUp' },
    { label: 'Alerts', path: '/alerts', icon: 'Bell' },
    { label: 'Device Monitoring', path: '/device', icon: 'Cpu' },
    { label: 'Settings', path: '/settings', icon: 'Settings' },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Patients', path: '/patients', icon: 'Users' },
    { label: 'Medicines', path: '/medications', icon: 'Pill' },
    { label: 'Adherence', path: '/adherence', icon: 'TrendingUp' },
    { label: 'Alerts', path: '/alerts', icon: 'Bell' },
    { label: 'Devices', path: '/device', icon: 'Cpu' },
    { label: 'Settings', path: '/settings', icon: 'Settings' },
  ],
};

// ─── Medication ───────────────────────────────────────────────
export const FREQUENCY_LABELS: Record<string, string> = {
  once: 'Once',
  daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: 'Three times daily',
  four_times_daily: 'Four times daily',
  weekly: 'Weekly',
  custom: 'Custom',
};

export const DOSAGE_UNITS = ['mg', 'ml', 'tablet', 'capsule', 'drops', 'puff', 'unit'] as const;

export const DOSE_STATUS_LABELS: Record<string, string> = {
  taken: 'Taken',
  missed: 'Missed',
  upcoming: 'Upcoming',
  pending: 'Pending',
  skipped: 'Skipped',
};

// ─── Alert Types ──────────────────────────────────────────────
export const ALERT_TYPE_LABELS: Record<string, string> = {
  missed_dose: 'Missed Dose',
  upcoming_dose: 'Upcoming Dose',
  low_adherence: 'Low Adherence',
  device_offline: 'Device Offline',
  device_disconnected: 'Device Disconnected',
  sensor_issue: 'Sensor Issue',
  system: 'System',
};

// ─── Device ───────────────────────────────────────────────────
export const COMPARTMENT_LABELS: Record<string, string> = {
  available: 'Available',
  scheduled: 'Scheduled',
  active: 'Active',
  opened: 'Opened',
  missed: 'Missed',
  error: 'Error',
};

// ─── Adherence Thresholds ─────────────────────────────────────
export const ADHERENCE_THRESHOLDS = {
  excellent: 95,
  good: 80,
  fair: 60,
  poor: 0,
} as const;

// ─── Time Windows ─────────────────────────────────────────────
export const TIME_WINDOWS = {
  morning: { start: 5, end: 12, label: 'Morning' },
  afternoon: { start: 12, end: 17, label: 'Afternoon' },
  evening: { start: 17, end: 21, label: 'Evening' },
  night: { start: 21, end: 5, label: 'Night' },
} as const;

// ─── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;

// ─── Local Storage Keys ───────────────────────────────────────
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'intellimed_token',
  REFRESH_TOKEN: 'intellimed_refresh',
  USER: 'intellimed_user',
  THEME: 'intellimed_theme',
  SELECTED_PATIENT: 'intellimed_selected_patient',
} as const;
