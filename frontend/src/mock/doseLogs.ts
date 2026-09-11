import type { DoseLog } from '@/types';
import { subDays, setHours, setMinutes, format } from 'date-fns';

// Generate realistic dose logs for the past 30 days for patient p-001
function generateDoseLogs(): DoseLog[] {
  const logs: DoseLog[] = [];
  let idCounter = 1;

  const today = new Date();

  for (let day = 29; day >= 0; day--) {
    const date = subDays(today, day);

    // Metformin 08:00 AM
    const isToday = day === 0;
    const currentHour = today.getHours();

    const metformin8am = setMinutes(setHours(new Date(date), 8), 0);
    const metformin8pm = setMinutes(setHours(new Date(date), 20), 0);
    const amlodipine1pm = setMinutes(setHours(new Date(date), 13), 0);

    // Morning metformin
    if (!isToday || currentHour > 8) {
      const taken = Math.random() > 0.07; // 93% adherence
      const delay = taken ? Math.floor(Math.random() * 20) : 0;
      logs.push({
        id: `dl-${String(idCounter++).padStart(4, '0')}`,
        medicationId: 'med-001',
        medicationName: 'Metformin',
        patientId: 'p-001',
        scheduledAt: metformin8am.toISOString(),
        takenAt: taken ? new Date(metformin8am.getTime() + delay * 60000).toISOString() : undefined,
        status: taken ? 'taken' : 'missed',
        compartment: 1,
        delay: taken ? delay : undefined,
        dose: 500,
        unit: 'mg',
      });
    }

    // Afternoon amlodipine
    if (!isToday || currentHour > 13) {
      const taken = Math.random() > 0.05;
      const delay = taken ? Math.floor(Math.random() * 30) : 0;
      logs.push({
        id: `dl-${String(idCounter++).padStart(4, '0')}`,
        medicationId: 'med-002',
        medicationName: 'Amlodipine',
        patientId: 'p-001',
        scheduledAt: amlodipine1pm.toISOString(),
        takenAt: taken ? new Date(amlodipine1pm.getTime() + delay * 60000).toISOString() : undefined,
        status: taken ? 'taken' : 'missed',
        compartment: 2,
        delay: taken ? delay : undefined,
        dose: 5,
        unit: 'mg',
      });
    }

    // Evening metformin
    if (!isToday || currentHour > 20) {
      const taken = Math.random() > 0.08;
      const delay = taken ? Math.floor(Math.random() * 25) : 0;
      logs.push({
        id: `dl-${String(idCounter++).padStart(4, '0')}`,
        medicationId: 'med-001',
        medicationName: 'Metformin',
        patientId: 'p-001',
        scheduledAt: metformin8pm.toISOString(),
        takenAt: taken ? new Date(metformin8pm.getTime() + delay * 60000).toISOString() : undefined,
        status: taken ? 'taken' : 'missed',
        compartment: 1,
        delay: taken ? delay : undefined,
        dose: 500,
        unit: 'mg',
      });
    }
  }

  // Today's schedule (future doses marked as upcoming)
  const todayHour = today.getHours();
  const todayMins = today.getMinutes();

  if (todayHour < 13) {
    const amlodipineToday = setMinutes(setHours(new Date(), 13), 0);
    logs.push({
      id: `dl-${String(idCounter++).padStart(4, '0')}`,
      medicationId: 'med-002',
      medicationName: 'Amlodipine',
      patientId: 'p-001',
      scheduledAt: amlodipineToday.toISOString(),
      status: 'upcoming',
      compartment: 2,
      dose: 5,
      unit: 'mg',
    });
  }

  if (todayHour < 20) {
    const metforminEvening = setMinutes(setHours(new Date(), 20), 0);
    logs.push({
      id: `dl-${String(idCounter++).padStart(4, '0')}`,
      medicationId: 'med-001',
      medicationName: 'Metformin',
      patientId: 'p-001',
      scheduledAt: metforminEvening.toISOString(),
      status: 'upcoming',
      compartment: 1,
      dose: 500,
      unit: 'mg',
    });

    const aspirinEvening = setMinutes(setHours(new Date(), 20), 0);
    logs.push({
      id: `dl-${String(idCounter++).padStart(4, '0')}`,
      medicationId: 'med-004',
      medicationName: 'Aspirin',
      patientId: 'p-001',
      scheduledAt: aspirinEvening.toISOString(),
      status: 'upcoming',
      compartment: 4,
      dose: 75,
      unit: 'mg',
    });
  }

  return logs;
}

export const MOCK_DOSE_LOGS: DoseLog[] = generateDoseLogs();

export function getMockDoseLogsByPatient(patientId: string): DoseLog[] {
  return MOCK_DOSE_LOGS.filter(l => l.patientId === patientId);
}

export function getMockTodayDoseLogs(patientId: string): DoseLog[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  return MOCK_DOSE_LOGS.filter(l => {
    return l.patientId === patientId && l.scheduledAt.startsWith(today);
  });
}
