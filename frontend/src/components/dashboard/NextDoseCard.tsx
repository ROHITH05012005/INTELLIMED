import { ArrowRight, Clock, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCountdown, formatTime, formatDose, formatCompartment } from '@/utils/formatting';
import type { NextDoseInfo } from '@/types';

interface NextDoseCardProps {
  nextDose: NextDoseInfo | undefined;
}

export function NextDoseCard({ nextDose }: NextDoseCardProps) {
  const countdown = useCountdown(nextDose?.scheduledAt);

  if (!nextDose) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-emerald-600 dark:text-emerald-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">All doses taken today!</p>
        <p className="text-xs text-slate-500">No upcoming doses remaining.</p>
      </div>
    );
  }

  return (
    <div className="card p-5 bg-gradient-to-br from-sky-600 to-teal-600 border-0 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-sky-200 mb-3">Next Dose</p>

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-3xl font-bold mb-0.5">
              {formatTime(nextDose.scheduledAt)}
            </p>
            <p className="text-lg font-semibold">{nextDose.medicationName}</p>
            <p className="text-sky-200 text-sm mt-0.5">
              {formatDose(nextDose.dose, nextDose.unit)} &bull; {formatCompartment(nextDose.compartment)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Package size={22} className="text-white" />
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-between">
          {countdown !== null ? (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-sky-200" />
              <span className="text-sm text-sky-100">
                Due in{' '}
                <span className="font-mono font-bold text-white">
                  {formatCountdown(countdown)}
                </span>
              </span>
            </div>
          ) : (
            <span className="text-sm text-sky-200">Due now</span>
          )}

          <Link
            to={`/medications/${nextDose.medicationId}`}
            className="flex items-center gap-1 text-xs font-medium text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Details
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
