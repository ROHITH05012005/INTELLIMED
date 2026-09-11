import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { AdherenceTrendPoint } from '@/types';
import { cn } from '@/utils/cn';

interface AdherenceMiniChartProps {
  trend: AdherenceTrendPoint[];
  current: number;
}

export function AdherenceMiniChart({ trend, current }: AdherenceMiniChartProps) {
  const color = current >= 95 ? '#22c55e' : current >= 80 ? '#0ea5e9' : current >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            7-Day Adherence
          </p>
          <p className={cn('text-3xl font-bold', current >= 95 ? 'text-emerald-600 dark:text-emerald-400' : current >= 80 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400')}>
            {current}%
          </p>
        </div>
        <div className={cn(
          'px-2.5 py-1 rounded-full text-xs font-semibold',
          current >= 95 ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' :
          current >= 80 ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400' :
          'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
        )}>
          {current >= 95 ? 'Excellent' : current >= 80 ? 'Good' : current >= 60 ? 'Fair' : 'Poor'}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: number) => [`${value}%`, 'Adherence']}
          />
          <Line
            type="monotone"
            dataKey="adherencePercent"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
