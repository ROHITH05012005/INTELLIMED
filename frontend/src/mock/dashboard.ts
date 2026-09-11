import type { DashboardMetrics } from '@/types';
import { format, addHours, setHours, setMinutes } from 'date-fns';

const now = new Date();

function makeNextDoseTime(hour: number, minute: number = 0): string {
  const t = setMinutes(setHours(new Date(), hour), minute);
  if (t <= now) {
    return addHours(t, 24).toISOString();
  }
  return t.toISOString();
}

export const MOCK_DASHBOARD_METRICS: Record<string, DashboardMetrics> = {
  'p-001': {
    patientId: 'p-001',
    date: format(now, 'yyyy-MM-dd'),
    todayTotal: 4,
    todayTaken: now.getHours() >= 8 ? 2 : 0,
    todayUpcoming: now.getHours() >= 8 ? 2 : 4,
    todayMissed: 0,
    adherencePercent: 94,
    adherenceTrend: +2.1,
    nextDose: {
      medicationId: 'med-002',
      medicationName: 'Amlodipine',
      scheduledAt: makeNextDoseTime(13, 0),
      dose: 5,
      unit: 'mg',
      compartment: 2,
    },
    streakDays: 14,
  },
  'p-002': {
    patientId: 'p-002',
    date: format(now, 'yyyy-MM-dd'),
    todayTotal: 3,
    todayTaken: 0,
    todayUpcoming: 0,
    todayMissed: 3,
    adherencePercent: 81,
    adherenceTrend: -5.2,
    nextDose: undefined,
    streakDays: 0,
  },
  'p-003': {
    patientId: 'p-003',
    date: format(now, 'yyyy-MM-dd'),
    todayTotal: 2,
    todayTaken: 2,
    todayUpcoming: 0,
    todayMissed: 0,
    adherencePercent: 99,
    adherenceTrend: +0.5,
    nextDose: {
      medicationId: 'med-009',
      medicationName: 'Calcium + D3',
      scheduledAt: makeNextDoseTime(21, 0),
      dose: 500,
      unit: 'mg',
      compartment: 2,
    },
    streakDays: 42,
  },
  'p-004': {
    patientId: 'p-004',
    date: format(now, 'yyyy-MM-dd'),
    todayTotal: 2,
    todayTaken: 1,
    todayUpcoming: 1,
    todayMissed: 0,
    adherencePercent: 87,
    adherenceTrend: -1.3,
    nextDose: {
      medicationId: 'med-005',
      medicationName: 'Furosemide',
      scheduledAt: makeNextDoseTime(20, 0),
      dose: 40,
      unit: 'mg',
      compartment: 1,
    },
    streakDays: 5,
  },
  'p-005': {
    patientId: 'p-005',
    date: format(now, 'yyyy-MM-dd'),
    todayTotal: 4,
    todayTaken: 1,
    todayUpcoming: 1,
    todayMissed: 2,
    adherencePercent: 76,
    adherenceTrend: -9.4,
    nextDose: {
      medicationId: 'med-001',
      medicationName: 'Metformin',
      scheduledAt: makeNextDoseTime(20, 0),
      dose: 500,
      unit: 'mg',
      compartment: 1,
    },
    streakDays: 1,
  },
};

export function getMockDashboardMetrics(patientId: string): DashboardMetrics | null {
  return MOCK_DASHBOARD_METRICS[patientId] ?? null;
}
