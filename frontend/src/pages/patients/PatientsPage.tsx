import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, ChevronRight, AlertTriangle, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { patientService } from '@/services/patient.service';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatting';
import type { Patient } from '@/types';

function AdherenceBadge({ pct }: { pct: number }) {
  const color = pct >= 95 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400' :
    pct >= 80 ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400' :
    'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400';
  return (
    <span className={cn('badge font-semibold', color)}>{pct}%</span>
  );
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    patientService.getAll().then(data => {
      setPatients(data);
      setIsLoading(false);
    });
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{patients.length} patients under care</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
          aria-label="Search patients"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <p className="text-sm text-slate-500">No patients found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Patient', 'Status', 'Adherence', 'Missed Today', 'Device', 'Last Activity', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient, idx) => {
                  const hasDevice = !!patient.deviceId;
                  const needsAttention = patient.missedDoses > 3 || patient.adherencePercent < 80 || patient.status === 'critical';
                  return (
                    <tr
                      key={patient.id}
                      className={cn(
                        'border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
                        idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-900/30'
                      )}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && navigate(`/patients/${patient.id}`)}
                      aria-label={`View ${patient.name}'s profile`}
                    >
                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-700 dark:text-sky-400 text-xs font-bold flex-shrink-0">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{patient.name}</p>
                            <p className="text-xs text-slate-500">{patient.age}y &bull; {patient.gender}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {needsAttention
                            ? <AlertTriangle size={13} className="text-rose-500" aria-label="Needs attention" />
                            : <CheckCircle2 size={13} className="text-emerald-500" aria-label="Good" />
                          }
                          <span className={cn('text-xs font-medium capitalize',
                            patient.status === 'critical' ? 'text-rose-600 dark:text-rose-400' :
                            patient.status === 'stable' ? 'text-emerald-600 dark:text-emerald-400' :
                            'text-slate-600 dark:text-slate-400'
                          )}>
                            {patient.status}
                          </span>
                        </div>
                      </td>

                      {/* Adherence */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full',
                                patient.adherencePercent >= 95 ? 'bg-emerald-500' :
                                patient.adherencePercent >= 80 ? 'bg-sky-500' : 'bg-amber-500'
                              )}
                              style={{ width: `${patient.adherencePercent}%` }}
                            />
                          </div>
                          <AdherenceBadge pct={patient.adherencePercent} />
                        </div>
                      </td>

                      {/* Missed */}
                      <td className="px-4 py-3">
                        <span className={cn('badge font-medium',
                          patient.missedDoses === 0 ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' :
                          patient.missedDoses <= 2 ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
                          'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                        )}>
                          {patient.missedDoses}
                        </span>
                      </td>

                      {/* Device */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {hasDevice
                            ? <Wifi size={13} className="text-emerald-500" />
                            : <WifiOff size={13} className="text-slate-400" />
                          }
                          <span className={cn('text-xs', hasDevice ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}>
                            {hasDevice ? 'Online' : 'None'}
                          </span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">
                          {patient.lastActivity ? formatRelativeTime(patient.lastActivity) : '—'}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td className="px-4 py-3">
                        <ChevronRight size={15} className="text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
