import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pill, Edit2, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientContext } from '@/contexts/PatientContext';
import { medicationService } from '@/services/medication.service';
import { FREQUENCY_LABELS } from '@/constants';
import { formatMedicationTime, formatShortDate } from '@/utils/formatting';
import { cn } from '@/utils/cn';
import type { Medication, MedicationStatus } from '@/types';

const STATUS_COLORS: Record<MedicationStatus, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400',
  paused: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
  completed: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
  discontinued: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400',
};

export default function MedicationsPage() {
  const { user, patientId } = useAuth();
  const { selectedPatient } = usePatientContext();
  const navigate = useNavigate();
  const activePatientId = user?.role === 'patient' ? patientId : selectedPatient?.id;

  const [medications, setMedications] = useState<Medication[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activePatientId) return;
    medicationService.getByPatient(activePatientId).then(meds => {
      setMedications(meds);
      setIsLoading(false);
    });
  }, [activePatientId]);

  const filtered = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.genericName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this medication? This will remove future reminders.')) return;
    await medicationService.delete(id);
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const handleTogglePause = async (med: Medication) => {
    const newStatus: MedicationStatus = med.status === 'paused' ? 'active' : 'paused';
    await medicationService.update(med.id, { status: newStatus });
    setMedications(prev => prev.map(m => m.id === med.id ? { ...m, status: newStatus } : m));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Medications</h1>
          <p className="page-subtitle">{medications.filter(m => m.status === 'active').length} active prescriptions</p>
        </div>
        <Link to="/medications/new" className="btn-primary">
          <Plus size={16} />
          Add Medication
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search medications..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
          aria-label="Search medications"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Pill size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {search ? 'No medications match your search' : 'No medications added yet'}
          </p>
          {!search && (
            <Link to="/medications/new" className="btn-primary inline-flex mt-4">
              <Plus size={16} />
              Add First Medication
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(med => (
            <div
              key={med.id}
              className="card p-4 hover:shadow-card-md transition-shadow duration-200 cursor-pointer group"
              onClick={() => navigate(`/medications/${med.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/medications/${med.id}`)}
              aria-label={`View details for ${med.name}`}
            >
              <div className="flex items-start gap-4">
                {/* Color dot */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: med.color ?? '#0ea5e9' + '20' }}
                >
                  <Pill size={18} style={{ color: med.color ?? '#0ea5e9' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{med.name}</p>
                      {med.genericName && (
                        <p className="text-xs text-slate-500 mt-0.5">{med.genericName}</p>
                      )}
                    </div>
                    <span className={cn('badge text-xs', STATUS_COLORS[med.status])}>
                      {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{med.dose} {med.unit}</span>
                    <span>&bull;</span>
                    <span>Slot {med.compartment}</span>
                    <span>&bull;</span>
                    <span>{FREQUENCY_LABELS[med.frequency]}</span>
                    <span>&bull;</span>
                    <span>{med.scheduledTimes.map(formatMedicationTime).join(', ')}</span>
                  </div>
                  {med.instructions && (
                    <p className="text-xs text-slate-400 mt-1.5 italic truncate">{med.instructions}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleTogglePause(med)}
                    className="btn-ghost p-1.5"
                    aria-label={med.status === 'paused' ? 'Resume medication' : 'Pause medication'}
                    title={med.status === 'paused' ? 'Resume' : 'Pause'}
                  >
                    {med.status === 'paused'
                      ? <PlayCircle size={16} className="text-emerald-500" />
                      : <PauseCircle size={16} className="text-amber-500" />
                    }
                  </button>
                  <Link
                    to={`/medications/${med.id}`}
                    className="btn-ghost p-1.5"
                    aria-label="Edit medication"
                    title="Edit"
                  >
                    <Edit2 size={15} className="text-slate-500" />
                  </Link>
                  <button
                    onClick={() => handleDelete(med.id)}
                    className="btn-ghost p-1.5"
                    aria-label="Delete medication"
                    title="Delete"
                  >
                    <Trash2 size={15} className="text-rose-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
