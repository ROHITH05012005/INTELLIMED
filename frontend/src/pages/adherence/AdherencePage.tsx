import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientContext } from '@/contexts/PatientContext';
import { medicationService } from '@/services/medication.service';
import { computeAdherenceTrend, computeTimeOfDayAdherence, computeDelayStats, calculateAdherence } from '@/utils/adherence';
import { cn } from '@/utils/cn';
import type { DoseLog } from '@/types';

type Period = '7d' | '30d' | '90d';
const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

function AdherenceGauge({ percent }: { percent: number }) {
  const color = percent >= 95 ? '#22c55e' : percent >= 80 ? '#0ea5e9' : percent >= 60 ? '#f59e0b' : '#f43f5e';
  const label = percent >= 95 ? 'Excellent' : percent >= 80 ? 'Good' : percent >= 60 ? 'Fair' : 'Poor';

  return (
    <div className="card p-8 flex flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Overall Adherence</p>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-800" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${percent} ${100 - percent}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold" style={{ color }}>{percent}%</p>
          <p className="text-xs font-medium" style={{ color }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdherencePage() {
  const { user, patientId } = useAuth();
  const { selectedPatient } = usePatientContext();
  const activePatientId = user?.role === 'patient' ? patientId : selectedPatient?.id;

  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activePatientId) return;
    medicationService.getDoseLogs(activePatientId).then(data => {
      setLogs(data);
      setIsLoading(false);
    });
  }, [activePatientId]);

  const finishedLogs = logs.filter(l => l.status === 'taken' || l.status === 'missed');
  const taken = finishedLogs.filter(l => l.status === 'taken').length;
  const missed = finishedLogs.filter(l => l.status === 'missed').length;
  const adherencePct = calculateAdherence(taken, taken + missed);
  const trend = computeAdherenceTrend(logs, PERIOD_DAYS[period]);
  const timeOfDay = computeTimeOfDayAdherence(logs);
  const delays = computeDelayStats(logs);

  const pieData = [
    { name: 'Taken', value: taken, color: '#22c55e' },
    { name: 'Missed', value: missed, color: '#f43f5e' },
  ];

  if (isLoading) {
    return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 skeleton rounded-xl" />)}
    </div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Adherence Analytics</h1>
        <p className="page-subtitle">
          {selectedPatient?.name ?? user?.name} &bull; Last 30 days
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdherenceGauge percent={adherencePct} />

        {/* Delay stats */}
        <div className="card p-6 flex flex-col justify-between sm:col-span-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Delay Statistics</p>
          <div className="grid grid-cols-3 gap-4 flex-1">
            {[
              { label: 'Average Delay', value: `${delays.average} min` },
              { label: 'Median Delay', value: `${delays.median} min` },
              { label: 'Longest Delay', value: `${delays.longest} min` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">{taken} doses taken</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-400">{missed} missed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Adherence Trend Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Adherence Trend</h2>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                  period === p
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v: number) => [`${v}%`, 'Adherence']} />
            <Line type="monotone" dataKey="adherencePercent" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: '#0ea5e9', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Taken vs Missed */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Taken vs Missed</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [v, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time of Day */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Adherence by Time of Day</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeOfDay} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Adherence']} />
              <Bar dataKey="adherencePercent" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
