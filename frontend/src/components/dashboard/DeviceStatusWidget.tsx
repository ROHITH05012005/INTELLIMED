import { Wifi, WifiOff, Battery, BatteryLow, Cpu, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatting';
import type { Device } from '@/types';

interface DeviceStatusWidgetProps {
  device: Device | null;
}

function BatteryIcon({ level }: { level: number }) {
  if (level < 20) return <BatteryLow size={14} className="text-rose-500" />;
  return <Battery size={14} className={level > 50 ? 'text-emerald-500' : 'text-amber-500'} />;
}

export function DeviceStatusWidget({ device }: DeviceStatusWidgetProps) {
  if (!device) {
    return (
      <div className="card p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Device Status</p>
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <Cpu size={24} className="text-slate-300 dark:text-slate-700" />
          <p className="text-sm text-slate-500">No device assigned</p>
        </div>
      </div>
    );
  }

  const isOnline = device.status === 'online';
  const wifiColors: Record<string, string> = {
    excellent: 'text-emerald-500',
    good: 'text-emerald-500',
    fair: 'text-amber-500',
    poor: 'text-rose-500',
    none: 'text-slate-400',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Device Status
        </p>
        <Link
          to="/device"
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
        >
          Manage
        </Link>
      </div>

      {/* Device header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          isOnline ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-slate-100 dark:bg-slate-800'
        )}>
          <Cpu size={18} className={isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{device.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn('status-dot animate-pulse-soft', isOnline ? 'bg-emerald-500' : 'bg-slate-400')} />
            <span className={cn('text-xs font-medium', isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {isOnline ? <Wifi size={13} className={wifiColors[device.wifiStrength]} /> : <WifiOff size={13} className="text-slate-400" />}
            <span>Wi-Fi</span>
          </div>
          <span className={cn('text-xs font-medium capitalize', wifiColors[device.wifiStrength] || 'text-slate-400')}>
            {isOnline ? device.wifiStrength : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <BatteryIcon level={device.batteryPercent} />
            <span>Battery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', device.batteryPercent > 50 ? 'bg-emerald-500' : device.batteryPercent > 20 ? 'bg-amber-500' : 'bg-rose-500')}
                style={{ width: `${device.batteryPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{device.batteryPercent}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <RefreshCw size={13} />
            <span>Last sync</span>
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {formatRelativeTime(device.lastSync)}
          </span>
        </div>
      </div>

      {/* Compartments mini grid */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Compartments</p>
        <div className="grid grid-cols-6 gap-1">
          {device.compartments.map(c => {
            const slotColors: Record<string, string> = {
              available: 'bg-slate-200 dark:bg-slate-800',
              scheduled: 'bg-sky-200 dark:bg-sky-900',
              active: 'bg-amber-400',
              opened: 'bg-emerald-400',
              missed: 'bg-rose-400',
              error: 'bg-rose-600',
            };
            return (
              <div
                key={c.slot}
                className={cn('h-4 rounded flex items-center justify-center', slotColors[c.status] || 'bg-slate-200')}
                title={`Slot ${c.slot}: ${c.status}${c.medicationName ? ` (${c.medicationName})` : ''}`}
              >
                <span className="text-[8px] font-bold text-white/80">{c.slot}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
