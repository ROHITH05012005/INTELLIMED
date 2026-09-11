import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, CheckCheck, Link as LinkIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatRelativeTime } from '@/utils/formatting';
import { ALERT_TYPE_LABELS } from '@/constants';
import { cn } from '@/utils/cn';
import type { Alert, AlertType, AlertPriority } from '@/types';

type Filter = 'all' | 'unread' | 'missed_dose' | 'device' | 'system';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'missed_dose', label: 'Missed Dose' },
  { id: 'device', label: 'Device' },
  { id: 'system', label: 'System' },
];

const PRIORITY_ICONS: Record<AlertPriority, LucideIcon> = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

const PRIORITY_COLORS: Record<AlertPriority, string> = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-sky-500',
};

const PRIORITY_BORDER: Record<AlertPriority, string> = {
  high: 'border-l-rose-500',
  medium: 'border-l-amber-500',
  low: 'border-l-sky-500',
};

function filterAlerts(alerts: Alert[], filter: Filter): Alert[] {
  switch (filter) {
    case 'unread': return alerts.filter(a => !a.isRead);
    case 'missed_dose': return alerts.filter(a => a.type === 'missed_dose');
    case 'device': return alerts.filter(a => a.type === 'device_offline' || a.type === 'device_disconnected' || a.type === 'sensor_issue');
    case 'system': return alerts.filter(a => a.type === 'system');
    default: return alerts;
  }
}

export default function AlertsPage() {
  const { alerts, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filterAlerts(alerts, filter);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications are read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary gap-2 text-sm">
            <CheckCheck size={15} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
              filter === f.id
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            {f.label}
            {f.id === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No alerts</p>
          <p className="text-xs text-slate-400 mt-1">
            {filter !== 'all' ? 'No alerts match this filter.' : 'Everything looks good!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const Icon = PRIORITY_ICONS[alert.priority];
            return (
              <div
                key={alert.id}
                className={cn(
                  'card p-4 border-l-4 transition-all duration-200 hover:shadow-card-md',
                  PRIORITY_BORDER[alert.priority],
                  !alert.isRead ? 'bg-white dark:bg-slate-900' : 'opacity-70'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    alert.priority === 'high' ? 'bg-rose-50 dark:bg-rose-950/50' :
                    alert.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-950/50' :
                    'bg-sky-50 dark:bg-sky-950/50'
                  )}>
                    <Icon size={15} className={PRIORITY_COLORS[alert.priority]} aria-hidden="true" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wider',
                          alert.priority === 'high' ? 'text-rose-600 dark:text-rose-400' :
                          alert.priority === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                          'text-sky-600 dark:text-sky-400'
                        )}>
                          {alert.priority.toUpperCase()} PRIORITY
                        </span>
                        <span className="text-[10px] text-slate-400">&bull;</span>
                        <span className="text-[10px] text-slate-500">{ALERT_TYPE_LABELS[alert.type]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatRelativeTime(alert.createdAt)}</span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" aria-label="Unread" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1.5">{alert.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{alert.message}</p>

                    {alert.patientName && (
                      <p className="text-xs text-slate-500 mt-1.5">Patient: <span className="font-medium">{alert.patientName}</span></p>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      {alert.actionUrl && (
                        <Link
                          to={alert.actionUrl}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                        >
                          <LinkIcon size={11} />
                          {alert.patientName ? 'View Patient' : 'View Details'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
