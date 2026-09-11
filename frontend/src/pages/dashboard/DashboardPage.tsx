import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientContext } from '@/contexts/PatientContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { medicationService } from '@/services/medication.service';
import { deviceService } from '@/services/device.service';
import { computeAdherenceTrend } from '@/utils/adherence';
import { getGreeting, formatFullDate } from '@/utils/formatting';
import { KPICards } from '@/components/dashboard/KPICards';
import { NextDoseCard } from '@/components/dashboard/NextDoseCard';
import { MedicationTimeline } from '@/components/dashboard/MedicationTimeline';
import { AdherenceMiniChart } from '@/components/dashboard/AdherenceMiniChart';
import { DeviceStatusWidget } from '@/components/dashboard/DeviceStatusWidget';
import { AlertsSummary } from '@/components/dashboard/AlertsSummary';
import type { DashboardMetrics, DoseLog, Device } from '@/types';
import { cn } from '@/utils/cn';

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-16 skeleton rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 skeleton rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-40 skeleton rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, patientId } = useAuth();
  const { selectedPatient } = usePatientContext();
  const { alerts } = useNotifications();

  const activePatientId = user?.role === 'patient' ? patientId : selectedPatient?.id;
  const displayName = user?.role === 'patient' ? user.name : selectedPatient?.name ?? 'Patient';

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    if (!activePatientId) return;
    try {
      setError(null);
      const [m, logs, dev] = await Promise.all([
        medicationService.getDashboardMetrics(activePatientId),
        medicationService.getTodayDoseLogs(activePatientId),
        deviceService.getByPatient(activePatientId),
      ]);
      setMetrics(m);
      setDoseLogs(logs);
      setDevice(dev);
      setLastRefresh(new Date());
    } catch (e) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    load();
  }, [activePatientId]);

  const adherenceTrend = computeAdherenceTrend(doseLogs, 7);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
          <RefreshCw size={20} className="text-rose-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Unable to load dashboard</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <button onClick={() => { setIsLoading(true); load(); }} className="btn-secondary text-sm">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {getGreeting()}, <span className="text-sky-600 dark:text-sky-400">{displayName.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatFullDate(new Date())}
          </p>
        </div>
        <button
          onClick={() => { setIsLoading(true); load(); }}
          className="btn-ghost flex items-center gap-1.5 text-xs"
          aria-label="Refresh dashboard"
          title={`Last refreshed at ${format(lastRefresh, 'h:mm:ss a')}`}
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      {metrics && <KPICards metrics={metrics} />}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next dose + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {metrics && <NextDoseCard nextDose={metrics.nextDose} />}

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Today&apos;s Medication Schedule
              </h2>
              <span className="text-xs text-slate-500">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>
            <MedicationTimeline doseLogs={doseLogs} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <AdherenceMiniChart
            trend={adherenceTrend}
            current={metrics?.adherencePercent ?? 0}
          />
          <DeviceStatusWidget device={device} />
          <AlertsSummary alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
