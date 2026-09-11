import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatting';
import type { Alert, AlertPriority } from '@/types';

interface AlertsSummaryProps {
  alerts: Alert[];
}

const PRIORITY_CONFIG: Record<AlertPriority, { icon: LucideIcon; color: string; bg: string }> = {
  high: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/50' },
  medium: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/50' },
  low: { icon: Info, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/50' },
};

export function AlertsSummary({ alerts }: AlertsSummaryProps) {
  const recent = alerts.filter(a => !a.isRead).slice(0, 3);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Active Alerts
        </p>
        <Link to="/alerts" className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium flex items-center gap-1">
          View all
          <ArrowRight size={11} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">All clear</p>
          <p className="text-xs text-slate-400 mt-0.5">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map(alert => {
            const config = PRIORITY_CONFIG[alert.priority];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border-l-2 text-left',
                  alert.priority === 'high' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20' :
                  alert.priority === 'medium' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' :
                  'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
                )}
              >
                <Icon size={14} className={cn('flex-shrink-0 mt-0.5', config.color)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {alert.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{alert.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(alert.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
