import { CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatTime, formatDose, formatCompartment } from '@/utils/formatting';
import type { DoseLog, DoseStatus } from '@/types';
import { parseISO, isAfter, isBefore } from 'date-fns';

interface MedicationTimelineProps {
  doseLogs: DoseLog[];
}

const STATUS_CONFIG: Record<DoseStatus, {
  icon: LucideIcon;
  label: string;
  dot: string;
  card: string;
  text: string;
}> = {
  taken: {
    icon: CheckCircle2,
    label: 'Taken',
    dot: 'bg-emerald-500',
    card: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  missed: {
    icon: AlertTriangle,
    label: 'Missed',
    dot: 'bg-rose-500',
    card: 'border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20',
    text: 'text-rose-600 dark:text-rose-400',
  },
  upcoming: {
    icon: Clock,
    label: 'Upcoming',
    dot: 'bg-sky-400',
    card: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    text: 'text-sky-600 dark:text-sky-400',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    dot: 'bg-amber-500',
    card: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
  skipped: {
    icon: Circle,
    label: 'Skipped',
    dot: 'bg-slate-400',
    card: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-500',
  },
};

function isNextDose(log: DoseLog, allLogs: DoseLog[]): boolean {
  const now = new Date();
  if (log.status !== 'upcoming') return false;
  const scheduledAt = parseISO(log.scheduledAt);
  if (!isAfter(scheduledAt, now)) return false;
  // Check if this is the earliest upcoming
  const earlier = allLogs.find(l => {
    if (l.id === log.id || l.status !== 'upcoming') return false;
    return isBefore(parseISO(l.scheduledAt), scheduledAt) && isAfter(parseISO(l.scheduledAt), now);
  });
  return !earlier;
}

export function MedicationTimeline({ doseLogs }: MedicationTimelineProps) {
  const sorted = [...doseLogs].sort((a, b) =>
    parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-slate-500">No medications scheduled for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((log, idx) => {
        const config = STATUS_CONFIG[log.status];
        const Icon = config.icon;
        const isNext = isNextDose(log, sorted);

        return (
          <div
            key={log.id}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200',
              config.card,
              isNext && 'ring-2 ring-sky-500/30 shadow-card-md'
            )}
            role="article"
            aria-label={`${log.medicationName} scheduled at ${formatTime(log.scheduledAt)}, status: ${config.label}`}
          >
            {/* Time */}
            <div className="w-16 flex-shrink-0 text-right">
              <p className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                {formatTime(log.scheduledAt)}
              </p>
            </div>

            {/* Timeline dot */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn('w-3 h-3 rounded-full mt-0.5 flex-shrink-0', config.dot)} />
              {idx < sorted.length - 1 && (
                <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-1 min-h-[16px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {log.medicationName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDose(log.dose, log.unit)} &bull; {formatCompartment(log.compartment)}
                  </p>
                  {log.takenAt && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Taken at {formatTime(log.takenAt)}
                      {log.delay ? ` (+${log.delay} min)` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Icon size={14} className={config.text} aria-hidden="true" />
                  <span className={cn('text-xs font-medium', config.text)}>
                    {config.label}
                    {isNext && ' — Next'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
