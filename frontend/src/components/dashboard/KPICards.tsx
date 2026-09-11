import { Pill, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { DashboardMetrics } from '@/types';

interface KPICardsProps {
  metrics: DashboardMetrics;
}

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconBg: string;
  trend?: number;
  accent?: string;
}

function KPICard({ label, value, subtext, icon: Icon, iconBg, trend, accent }: KPICardProps) {
  const TrendIcon = trend !== undefined
    ? (trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus)
    : null;

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-card-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon size={18} className="text-white" />
        </div>
        {TrendIcon && trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            trend > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400' :
              trend < 0 ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400' :
                'text-slate-500 bg-slate-100 dark:bg-slate-800',
          )}>
            <TrendIcon size={11} />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <p className={cn('text-3xl font-bold tracking-tight', accent ?? 'text-slate-900 dark:text-slate-100')}>
          {value}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</p>
        {subtext && (
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export function KPICards({ metrics }: KPICardsProps) {
  const adherenceColor =
    metrics.adherencePercent >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
    metrics.adherencePercent >= 80 ? 'text-sky-600 dark:text-sky-400' :
    metrics.adherencePercent >= 60 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <KPICard
        label="Today's Doses"
        value={metrics.todayTotal}
        subtext="Total scheduled"
        icon={Pill}
        iconBg="bg-sky-500"
      />
      <KPICard
        label="Taken"
        value={metrics.todayTaken}
        subtext={metrics.todayTotal > 0 ? `${Math.round((metrics.todayTaken / metrics.todayTotal) * 100)}% of today` : '-'}
        icon={CheckCircle2}
        iconBg="bg-emerald-500"
        accent="text-emerald-600 dark:text-emerald-400"
      />
      <KPICard
        label="Upcoming"
        value={metrics.todayUpcoming}
        subtext="Doses remaining"
        icon={Clock}
        iconBg="bg-amber-500"
        accent="text-amber-600 dark:text-amber-400"
      />
      <KPICard
        label="Missed"
        value={metrics.todayMissed}
        subtext={metrics.todayMissed === 0 ? 'None today' : 'Requires attention'}
        icon={AlertTriangle}
        iconBg={metrics.todayMissed > 0 ? 'bg-rose-500' : 'bg-slate-400'}
        accent={metrics.todayMissed > 0 ? 'text-rose-600 dark:text-rose-400' : undefined}
      />
      <KPICard
        label="Adherence"
        value={`${metrics.adherencePercent}%`}
        subtext={`${metrics.streakDays}-day streak`}
        icon={Flame}
        iconBg={metrics.adherencePercent >= 95 ? 'bg-emerald-500' : metrics.adherencePercent >= 80 ? 'bg-sky-500' : 'bg-amber-500'}
        trend={metrics.adherenceTrend}
        accent={adherenceColor}
      />
    </div>
  );
}
