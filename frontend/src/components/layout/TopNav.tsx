import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Sun, Moon, Monitor, ChevronDown, User, Settings, LogOut,
  Wifi, WifiOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePatientContext } from '@/contexts/PatientContext';
import { formatRelativeTime } from '@/utils/formatting';
import { cn } from '@/utils/cn';
import { ALERT_TYPE_LABELS } from '@/constants';
import type { Alert, AlertPriority } from '@/types';

function AlertPriorityDot({ priority }: { priority: AlertPriority }) {
  return (
    <span
      className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1', {
        'bg-rose-500': priority === 'high',
        'bg-amber-500': priority === 'medium',
        'bg-sky-500': priority === 'low',
      })}
      aria-label={`${priority} priority`}
    />
  );
}

interface TopNavProps {
  onMobileMenuToggle: () => void;
}

export function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { selectedPatient, patients, selectPatient } = usePatientContext();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const patientRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (patientRef.current && !patientRef.current.contains(e.target as Node)) setPatientOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const recentAlerts = alerts.slice(0, 5);

  const cycleTheme = () => {
    const order: typeof theme[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showPatientSelector = user?.role === 'caregiver' || user?.role === 'admin';

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
      {/* Left: mobile menu + patient selector */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden btn-ghost p-2"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Patient selector */}
        {showPatientSelector && selectedPatient && (
          <div className="relative" ref={patientRef}>
            <button
              onClick={() => setPatientOpen(!patientOpen)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              aria-label="Select patient"
            >
              <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-sky-700 dark:text-sky-300 text-xs font-bold">
                {selectedPatient.name.charAt(0)}
              </div>
              <span className="hidden sm:inline">{selectedPatient.name}</span>
              <ChevronDown size={14} className={cn('transition-transform', patientOpen && 'rotate-180')} />
            </button>

            {patientOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 card-md z-50 py-1 animate-slide-up">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Switch Patient
                </p>
                {patients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { selectPatient(p); setPatientOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                      selectedPatient.id === p.id && 'text-sky-600 dark:text-sky-400 font-medium'
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-xs font-bold text-sky-700 dark:text-sky-300">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.adherencePercent}% adherence</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Device status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <Wifi size={12} />
          <span>Device Online</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="btn-ghost p-2"
          aria-label={`Current theme: ${theme}. Click to cycle.`}
        >
          <ThemeIcon size={16} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="btn-ghost p-2 relative"
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 card-md z-50 animate-slide-up overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500">No notifications</p>
                  </div>
                ) : (
                  recentAlerts.map(alert => (
                    <button
                      key={alert.id}
                      onClick={() => { markAsRead(alert.id); setNotifOpen(false); }}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0',
                        !alert.isRead && 'bg-sky-50/50 dark:bg-sky-950/20'
                      )}
                    >
                      <AlertPriorityDot priority={alert.priority} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-xs font-medium truncate', !alert.isRead ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400')}>
                          {alert.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{alert.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(alert.createdAt)}</p>
                      </div>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1" aria-hidden="true" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/alerts"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Profile menu"
          >
            <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <ChevronDown size={14} className={cn('text-slate-500 transition-transform hidden sm:block', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 card-md z-50 py-1 animate-slide-up">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <User size={14} />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <Settings size={14} />
                Settings
              </Link>
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
