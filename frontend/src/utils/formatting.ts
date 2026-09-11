import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';
import type { DosageUnit } from '@/types';

/**
 * Format a "HH:mm" time string to "h:mm AM/PM" display format.
 */
export function formatMedicationTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  return format(date, 'h:mm a');
}

/**
 * Format an ISO datetime string to relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return isoString;
  }
}

/**
 * Format a date string with context (Today, Yesterday, or date).
 */
export function formatDate(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format a date for display in the UI (e.g., "Tuesday, 11 September 2026").
 */
export function formatFullDate(date: Date = new Date()): string {
  return format(date, 'EEEE, d MMMM yyyy');
}

/**
 * Format a time from ISO string.
 */
export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm a');
}

/**
 * Format a date for table display.
 */
export function formatShortDate(isoString: string): string {
  return format(parseISO(isoString), 'MMM d, yyyy');
}

/**
 * Format a dose description (e.g., "500 mg").
 */
export function formatDose(dose: number, unit: DosageUnit): string {
  return `${dose} ${unit}`;
}

/**
 * Format a compartment label (e.g., "Slot 2").
 */
export function formatCompartment(slot: number): string {
  return `Slot ${slot}`;
}

/**
 * Format delay in minutes to a readable string.
 */
export function formatDelay(minutes: number): string {
  if (minutes === 0) return 'On time';
  if (minutes < 60) return `${minutes} min late`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m late` : `${hours}h late`;
}

/**
 * Format countdown duration to HH:MM:SS.
 */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Get greeting based on current time.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}
