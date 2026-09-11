import type { DoseLog, DoseStatus, AdherenceSummary, AdherenceTrendPoint } from '@/types';
import { format, subDays, parseISO, differenceInMinutes } from 'date-fns';
import { TIME_WINDOWS, ADHERENCE_THRESHOLDS } from '@/constants';

/**
 * Calculates adherence percentage from taken and scheduled counts.
 */
export function calculateAdherence(taken: number, scheduled: number): number {
  if (scheduled === 0) return 100;
  return Math.round((taken / scheduled) * 100);
}

/**
 * Calculate delay in minutes between scheduled and actual taken time.
 */
export function calculateDelay(scheduledAt: string, takenAt: string): number {
  return Math.max(0, differenceInMinutes(parseISO(takenAt), parseISO(scheduledAt)));
}

/**
 * Derive the dose status from a DoseLog entry.
 */
export function getDoseStatus(log: DoseLog): DoseStatus {
  return log.status;
}

/**
 * Get the next upcoming dose from a list of dose logs.
 */
export function getNextDose(logs: DoseLog[]): DoseLog | undefined {
  const now = new Date();
  return logs
    .filter(l => l.status === 'upcoming' && parseISO(l.scheduledAt) > now)
    .sort((a, b) => parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime())[0];
}

/**
 * Returns an adherence label based on the percentage value.
 */
export function getAdherenceLabel(percent: number): string {
  if (percent >= ADHERENCE_THRESHOLDS.excellent) return 'Excellent';
  if (percent >= ADHERENCE_THRESHOLDS.good) return 'Good';
  if (percent >= ADHERENCE_THRESHOLDS.fair) return 'Fair';
  return 'Poor';
}

/**
 * Returns a semantic color class for an adherence percentage.
 */
export function getAdherenceColorClass(percent: number): string {
  if (percent >= ADHERENCE_THRESHOLDS.excellent) return 'text-success-600';
  if (percent >= ADHERENCE_THRESHOLDS.good) return 'text-brand-600';
  if (percent >= ADHERENCE_THRESHOLDS.fair) return 'text-warning-600';
  return 'text-danger-600';
}

/**
 * Compute adherence trend data for charting from dose logs.
 */
export function computeAdherenceTrend(logs: DoseLog[], days: number = 7): AdherenceTrendPoint[] {
  const trend: AdherenceTrendPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    const dayLogs = logs.filter(l => l.scheduledAt.startsWith(dateStr));
    const taken = dayLogs.filter(l => l.status === 'taken').length;
    const missed = dayLogs.filter(l => l.status === 'missed').length;
    const total = taken + missed;

    trend.push({
      date: format(date, 'MMM d'),
      adherencePercent: calculateAdherence(taken, total),
      taken,
      missed,
    });
  }

  return trend;
}

/**
 * Get time-of-day breakdown of adherence.
 */
export function computeTimeOfDayAdherence(logs: DoseLog[]) {
  const windows = [
    { key: 'morning', label: 'Morning', start: 5, end: 12 },
    { key: 'afternoon', label: 'Afternoon', start: 12, end: 17 },
    { key: 'evening', label: 'Evening', start: 17, end: 21 },
    { key: 'night', label: 'Night', start: 21, end: 5 },
  ];

  return windows.map(w => {
    const windowLogs = logs.filter(l => {
      const hour = parseISO(l.scheduledAt).getHours();
      if (w.key === 'night') return hour >= 21 || hour < 5;
      return hour >= w.start && hour < w.end;
    }).filter(l => l.status === 'taken' || l.status === 'missed');

    const taken = windowLogs.filter(l => l.status === 'taken').length;
    const missed = windowLogs.filter(l => l.status === 'missed').length;
    return {
      period: w.key as AdherenceSummary['byTimeOfDay'][number]['period'],
      label: w.label,
      adherencePercent: calculateAdherence(taken, taken + missed),
      taken,
      missed,
    };
  });
}

/**
 * Compute delay statistics from dose logs.
 */
export function computeDelayStats(logs: DoseLog[]): { average: number; median: number; longest: number } {
  const delays = logs
    .filter(l => l.status === 'taken' && l.delay !== undefined)
    .map(l => l.delay as number);

  if (delays.length === 0) return { average: 0, median: 0, longest: 0 };

  const sorted = [...delays].sort((a, b) => a - b);
  const average = Math.round(delays.reduce((s, d) => s + d, 0) / delays.length);
  const median = sorted[Math.floor(sorted.length / 2)];
  const longest = sorted[sorted.length - 1];

  return { average, median, longest };
}
