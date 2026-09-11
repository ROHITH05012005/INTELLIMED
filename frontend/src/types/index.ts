// ============================================================
// INTELLIMED — Core TypeScript Types & Interfaces
// ============================================================

// ─── User & Auth ────────────────────────────────────────────
export type UserRole = 'patient' | 'caregiver' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// ─── Patient ─────────────────────────────────────────────────
export type PatientStatus = 'active' | 'inactive' | 'critical' | 'stable';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  phone?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  conditions?: string[];
  allergies?: string[];
  caregiverId?: string;
  caregiverName?: string;
  deviceId?: string;
  status: PatientStatus;
  adherencePercent: number;
  missedDoses: number;
  lastActivity?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Medication ───────────────────────────────────────────────
export type DosageUnit = 'mg' | 'mcg' | 'ml' | 'tablet' | 'capsule' | 'drops' | 'puff' | 'unit';
export type MedicationFrequency =
  | 'once'
  | 'daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'weekly'
  | 'custom';

export type MedicationStatus = 'active' | 'paused' | 'completed' | 'discontinued';

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  dose: number;
  unit: DosageUnit;
  compartment: number; // 1-6
  frequency: MedicationFrequency;
  scheduledTimes: string[]; // "HH:mm" format
  instructions?: string;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  prescribedBy?: string;
  category?: string;
  color?: string; // for UI differentiation
  createdAt: string;
  updatedAt: string;
}

// ─── Schedule & Dose Logs ─────────────────────────────────────
export type DoseStatus = 'taken' | 'missed' | 'upcoming' | 'pending' | 'skipped';

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledAt: string; // ISO datetime
  compartment: number;
  status: DoseStatus;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  patientId: string;
  scheduledAt: string;
  takenAt?: string;
  status: DoseStatus;
  compartment: number;
  delay?: number; // minutes
  dose: number;
  unit: DosageUnit;
  notes?: string;
}

// ─── Adherence ────────────────────────────────────────────────
export interface AdherenceSummary {
  patientId: string;
  period: '7d' | '30d' | '90d';
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  adherencePercent: number;
  averageDelay: number; // minutes
  medianDelay: number;
  longestDelay: number;
  byMedicine: AdherenceByMedicine[];
  byTimeOfDay: AdherenceByTime[];
  trend: AdherenceTrendPoint[];
}

export interface AdherenceByMedicine {
  medicationId: string;
  medicationName: string;
  adherencePercent: number;
  taken: number;
  missed: number;
}

export interface AdherenceByTime {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  label: string;
  adherencePercent: number;
  taken: number;
  missed: number;
}

export interface AdherenceTrendPoint {
  date: string;
  adherencePercent: number;
  taken: number;
  missed: number;
}

// ─── Dashboard ────────────────────────────────────────────────
export interface DashboardMetrics {
  patientId: string;
  date: string;
  todayTotal: number;
  todayTaken: number;
  todayUpcoming: number;
  todayMissed: number;
  adherencePercent: number;
  adherenceTrend: number; // delta from previous period
  nextDose?: NextDoseInfo;
  streakDays: number;
}

export interface NextDoseInfo {
  medicationId: string;
  medicationName: string;
  scheduledAt: string;
  dose: number;
  unit: DosageUnit;
  compartment: number;
}

// ─── Alerts ───────────────────────────────────────────────────
export type AlertType =
  | 'missed_dose'
  | 'upcoming_dose'
  | 'low_adherence'
  | 'device_offline'
  | 'device_disconnected'
  | 'sensor_issue'
  | 'system';

export type AlertPriority = 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  medicationId?: string;
  medicationName?: string;
  deviceId?: string;
  isRead: boolean;
  createdAt: string;
  resolvedAt?: string;
  actionUrl?: string;
}

// ─── Device ───────────────────────────────────────────────────
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance';
export type CompartmentStatus = 'available' | 'scheduled' | 'active' | 'opened' | 'missed' | 'error';

export interface Compartment {
  slot: number; // 1-6
  status: CompartmentStatus;
  medicationId?: string;
  medicationName?: string;
  scheduledAt?: string;
  lastOpened?: string;
}

export interface DeviceEvent {
  id: string;
  deviceId: string;
  type: 'slot_opened' | 'reminder_triggered' | 'dose_confirmed' | 'connection_change' | 'sync' | 'error';
  slot?: number;
  message: string;
  timestamp: string;
}

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  patientId: string;
  patientName: string;
  status: DeviceStatus;
  wifiStrength: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  wifiSSID?: string;
  batteryPercent: number;
  firmwareVersion: string;
  lastSeen: string;
  lastSync: string;
  ipAddress?: string;
  compartments: Compartment[];
  recentEvents: DeviceEvent[];
  createdAt: string;
}

// ─── UI Helpers ───────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
