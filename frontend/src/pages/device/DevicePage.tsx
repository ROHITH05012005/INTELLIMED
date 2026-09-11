import { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff, Battery, BatteryLow, RefreshCw, Clock, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientContext } from '@/contexts/PatientContext';
import { deviceService } from '@/services/device.service';
import { formatRelativeTime } from '@/utils/formatting';
import { cn } from '@/utils/cn';
import type { Device, CompartmentStatus } from '@/types';

const COMPARTMENT_COLORS: Record<CompartmentStatus, { bg: string; text: string; border: string; label: string }> = {
  available: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-400', border: 'border-slate-200 dark:border-slate-700', label: 'Available' },
  scheduled: { bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-900', label: 'Scheduled' },
  active: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900', label: 'Active' },
  opened: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900', label: 'Opened' },
  missed: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900', label: 'Missed' },
  error: { bg: 'bg-rose-100 dark:bg-rose-950/70', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-400', label: 'Error' },
};

const EVENT_ICONS: Record<string, LucideIcon> = {
  slot_opened: Cpu,
  reminder_triggered: Zap,
  dose_confirmed: Cpu,
  connection_change: Wifi,
  sync: RefreshCw,
  error: Cpu,
};

export default function DevicePage() {
  const { user, patientId } = useAuth();
  const { selectedPatient } = usePatientContext();
  const activePatientId = user?.role === 'patient' ? patientId : selectedPatient?.id;

  const [device, setDevice] = useState<Device | null>(null);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (user?.role === 'admin' || user?.role === 'caregiver') {
        const devs = await deviceService.getAll();
        setAllDevices(devs);
        const dev = activePatientId ? devs.find(d => d.patientId === activePatientId) ?? null : devs[0] ?? null;
        setDevice(dev);
      } else if (activePatientId) {
        const dev = await deviceService.getByPatient(activePatientId);
        setDevice(dev);
      }
      setIsLoading(false);
    };
    load();
  }, [activePatientId, user?.role]);

  const handleSync = async () => {
    if (!device) return;
    setIsSyncing(true);
    await deviceService.triggerSync(device.id);
    setIsSyncing(false);
  };

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
    </div>;
  }

  if (!device) {
    return (
      <div className="card p-12 text-center">
        <Cpu size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No device assigned</p>
        <p className="text-xs text-slate-400 mt-1">This patient does not have an INTELLIMED box yet.</p>
      </div>
    );
  }

  const isOnline = device.status === 'online';
  const wifiStrengthLabel = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', none: 'No Signal' };
  const wifiStrengthColor = { excellent: 'text-emerald-500', good: 'text-emerald-500', fair: 'text-amber-500', poor: 'text-rose-500', none: 'text-slate-400' };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Device Monitoring</h1>
          <p className="page-subtitle">{device.name} &bull; {device.serialNumber}</p>
        </div>
        <button onClick={handleSync} disabled={isSyncing || !isOnline} className="btn-secondary gap-2">
          <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device info */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', isOnline ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-slate-100 dark:bg-slate-800')}>
                <Cpu size={22} className={isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{device.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('status-dot', isOnline ? 'bg-emerald-500 animate-pulse-soft' : 'bg-slate-400')} />
                  <span className={cn('text-xs font-medium', isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500')}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: 'Patient', value: device.patientName },
                { label: 'Serial No.', value: device.serialNumber, mono: true },
                { label: 'Firmware', value: device.firmwareVersion, mono: true },
                { label: 'IP Address', value: device.ipAddress ?? '—', mono: true },
                { label: 'Last Seen', value: formatRelativeTime(device.lastSeen) },
                { label: 'Last Sync', value: formatRelativeTime(device.lastSync) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{row.label}</span>
                  <span className={cn('text-xs font-medium text-slate-700 dark:text-slate-300', row.mono && 'font-mono')}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Connectivity */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Connectivity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  {isOnline ? <Wifi size={15} className={wifiStrengthColor[device.wifiStrength]} /> : <WifiOff size={15} className="text-slate-400" />}
                  <span>Wi-Fi</span>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-semibold', wifiStrengthColor[device.wifiStrength])}>
                    {wifiStrengthLabel[device.wifiStrength]}
                  </p>
                  {device.wifiSSID && <p className="text-[10px] text-slate-500 font-mono">{device.wifiSSID}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  {device.batteryPercent < 20
                    ? <BatteryLow size={15} className="text-rose-500" />
                    : <Battery size={15} className={device.batteryPercent > 50 ? 'text-emerald-500' : 'text-amber-500'} />
                  }
                  <span>Battery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', device.batteryPercent > 50 ? 'bg-emerald-500' : device.batteryPercent > 20 ? 'bg-amber-500' : 'bg-rose-500')}
                      style={{ width: `${device.batteryPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{device.batteryPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compartments + Events */}
        <div className="lg:col-span-2 space-y-4">
          {/* Compartment grid */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Compartments</h2>
            <div className="grid grid-cols-3 gap-3">
              {device.compartments.map(c => {
                const config = COMPARTMENT_COLORS[c.status];
                return (
                  <div
                    key={c.slot}
                    className={cn('p-4 rounded-xl border-2 flex flex-col gap-2 transition-all', config.bg, config.border)}
                    aria-label={`Slot ${c.slot}: ${config.label}${c.medicationName ? `, ${c.medicationName}` : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-700 dark:text-slate-300">#{c.slot}</span>
                      <span className={cn('badge text-[10px]', config.bg, config.text, 'border', config.border)}>
                        {config.label}
                      </span>
                    </div>
                    {c.medicationName ? (
                      <>
                        <p className={cn('text-xs font-medium truncate', config.text)}>{c.medicationName}</p>
                        {c.lastOpened && (
                          <p className="text-[10px] text-slate-400">
                            Opened {formatRelativeTime(c.lastOpened)}
                          </p>
                        )}
                        {c.scheduledAt && (
                          <p className="text-[10px] text-slate-400">
                            Due {formatRelativeTime(c.scheduledAt)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">Empty</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {Object.entries(COMPARTMENT_COLORS).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={cn('w-2.5 h-2.5 rounded', config.bg, 'border', config.border)} />
                  <span className="text-[10px] text-slate-500">{config.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Event timeline */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Events</h2>
            <div className="space-y-3">
              {device.recentEvents.map((evt, idx) => {
                const Icon = EVENT_ICONS[evt.type] ?? Clock;
                const isError = evt.type === 'error';
                return (
                  <div key={evt.id} className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        isError ? 'bg-rose-50 dark:bg-rose-950/50' : 'bg-slate-100 dark:bg-slate-800'
                      )}>
                        <Icon size={14} className={isError ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'} />
                      </div>
                      {idx < device.recentEvents.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-1 min-h-[12px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-3">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{evt.message}</p>
                      {evt.slot && <p className="text-[10px] text-slate-500 mt-0.5">Slot {evt.slot}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(evt.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
