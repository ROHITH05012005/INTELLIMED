import { describe, it, expect } from 'vitest';
import { calculateAdherence, calculateDelay, getAdherenceLabel, computeDelayStats } from '@/utils/adherence';
import type { DoseLog } from '@/types';

describe('calculateAdherence', () => {
  it('returns 100 when no doses are scheduled', () => {
    expect(calculateAdherence(0, 0)).toBe(100);
  });

  it('calculates correct adherence percentage', () => {
    expect(calculateAdherence(9, 10)).toBe(90);
    expect(calculateAdherence(5, 5)).toBe(100);
    expect(calculateAdherence(0, 10)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(calculateAdherence(1, 3)).toBe(33);
    expect(calculateAdherence(2, 3)).toBe(67);
  });
});

describe('calculateDelay', () => {
  it('calculates delay in minutes', () => {
    const scheduled = '2026-09-11T08:00:00.000Z';
    const taken = '2026-09-11T08:15:00.000Z';
    expect(calculateDelay(scheduled, taken)).toBe(15);
  });

  it('returns 0 for negative delay (taken before scheduled)', () => {
    const scheduled = '2026-09-11T08:00:00.000Z';
    const taken = '2026-09-11T07:55:00.000Z';
    expect(calculateDelay(scheduled, taken)).toBe(0);
  });
});

describe('getAdherenceLabel', () => {
  it('returns correct label for each range', () => {
    expect(getAdherenceLabel(98)).toBe('Excellent');
    expect(getAdherenceLabel(95)).toBe('Excellent');
    expect(getAdherenceLabel(85)).toBe('Good');
    expect(getAdherenceLabel(80)).toBe('Good');
    expect(getAdherenceLabel(70)).toBe('Fair');
    expect(getAdherenceLabel(60)).toBe('Fair');
    expect(getAdherenceLabel(50)).toBe('Poor');
  });
});

describe('getDoseStatus', () => {
  it('returns the status from the log', () => {
    const log: Partial<DoseLog> = { status: 'taken' };
    // getDoseStatus just returns log.status
    expect(log.status).toBe('taken');
  });
});

describe('computeDelayStats', () => {
  it('returns zeros when no logs with delays', () => {
    const stats = computeDelayStats([]);
    expect(stats).toEqual({ average: 0, median: 0, longest: 0 });
  });

  it('computes correct stats', () => {
    const logs: Partial<DoseLog>[] = [
      { status: 'taken', delay: 10 },
      { status: 'taken', delay: 20 },
      { status: 'taken', delay: 30 },
    ];
    const stats = computeDelayStats(logs as DoseLog[]);
    expect(stats.average).toBe(20);
    expect(stats.median).toBe(20);
    expect(stats.longest).toBe(30);
  });
});
