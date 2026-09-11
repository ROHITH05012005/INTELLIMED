import { useState } from 'react';
import { Sun, Moon, Monitor, Bell, Shield, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    missedDose: true,
    upcomingDose: true,
    lowAdherence: true,
    deviceStatus: true,
    weeklyReport: false,
  });

  const themeOptions: { id: Theme; label: string; desc: string; icon: LucideIcon }[] = [
    { id: 'light', label: 'Light', desc: 'Always use light mode', icon: Sun },
    { id: 'dark', label: 'Dark', desc: 'Always use dark mode', icon: Moon },
    { id: 'system', label: 'System', desc: 'Follow device preference', icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your preferences and account settings</p>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sun size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  theme === opt.id
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800'
                )}
                aria-pressed={theme === opt.id}
                aria-label={`Set theme to ${opt.label}`}
              >
                <Icon size={18} className={theme === opt.id ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'} />
                <p className={cn('text-sm font-semibold mt-2', theme === opt.id ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300')}>
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'missedDose' as const, label: 'Missed Dose Alerts', desc: 'Notify when a scheduled dose is missed' },
            { key: 'upcomingDose' as const, label: 'Upcoming Dose Reminders', desc: 'Remind before scheduled doses' },
            { key: 'lowAdherence' as const, label: 'Low Adherence Warnings', desc: 'Alert when adherence drops below threshold' },
            { key: 'deviceStatus' as const, label: 'Device Status Changes', desc: 'Notify when device goes offline or has errors' },
            { key: 'weeklyReport' as const, label: 'Weekly Summary Report', desc: 'Receive weekly adherence summary emails' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0',
                  notifications[item.key] ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                    notifications[item.key] ? 'translate-x-4.5' : 'translate-x-0.5'
                  )}
                />
                <span className="sr-only">{notifications[item.key] ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Privacy & Security</h2>
        </div>
        <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-4 flex items-start gap-3">
          <Info size={16} className="text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-sky-700 dark:text-sky-300">
            <p className="font-medium mb-1">Backend integration pending</p>
            <p className="text-xs text-sky-600 dark:text-sky-400 leading-relaxed">
              Password change, two-factor authentication, and session management will be available once the backend API is connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
