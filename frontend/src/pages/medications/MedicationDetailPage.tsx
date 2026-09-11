import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, PauseCircle, PlayCircle, Pill } from 'lucide-react';
import { medicationService } from '@/services/medication.service';
import { FREQUENCY_LABELS } from '@/constants';
import { formatMedicationTime, formatShortDate, formatRelativeTime } from '@/utils/formatting';
import { cn } from '@/utils/cn';
import type { Medication, DoseLog } from '@/types';

function CompartmentGrid({ active }: { active: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }, (_, i) => i + 1).map(slot => (
        <div
          key={slot}
          className={cn(
            'h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all',
            slot === active
              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
          )}
          aria-label={`Slot ${slot}${slot === active ? ' (active)' : ''}`}
        >
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{slot}</span>
          {slot === active && (
            <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">Active</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MedicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      medicationService.getById(id),
    ]).then(([med]) => {
      setMedication(med);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await medicationService.delete(id);
    navigate('/medications');
  };

  const handleTogglePause = async () => {
    if (!medication) return;
    const newStatus = medication.status === 'paused' ? 'active' : 'paused';
    const updated = await medicationService.update(medication.id, { status: newStatus });
    setMedication(updated);
  };

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-12 skeleton rounded-xl" />
      <div className="h-64 skeleton rounded-xl" />
    </div>;
  }

  if (!medication) {
    return (
      <div className="card p-12 text-center">
        <Pill size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm text-slate-500">Medication not found.</p>
        <Link to="/medications" className="btn-secondary inline-flex mt-4">Back to Medications</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{medication.name}</h1>
            {medication.genericName && <p className="page-subtitle">{medication.genericName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTogglePause} className="btn-secondary gap-2">
            {medication.status === 'paused'
              ? <><PlayCircle size={15} className="text-emerald-500" /> Resume</>
              : <><PauseCircle size={15} className="text-amber-500" /> Pause</>
            }
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger gap-2">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Medication Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Dose', value: `${medication.dose} ${medication.unit}` },
                { label: 'Frequency', value: FREQUENCY_LABELS[medication.frequency] },
                { label: 'Compartment', value: `Slot ${medication.compartment}` },
                { label: 'Status', value: medication.status.charAt(0).toUpperCase() + medication.status.slice(1) },
                { label: 'Start Date', value: formatShortDate(medication.startDate) },
                { label: 'End Date', value: medication.endDate ? formatShortDate(medication.endDate) : 'Ongoing' },
                { label: 'Prescribed By', value: medication.prescribedBy ?? 'Not specified' },
                { label: 'Category', value: medication.category ?? 'General' },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{row.label}</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Scheduled Times</h2>
            <div className="flex flex-wrap gap-2">
              {medication.scheduledTimes.map(t => (
                <span key={t} className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 text-sm font-mono font-medium border border-sky-200 dark:border-sky-900">
                  {formatMedicationTime(t)}
                </span>
              ))}
            </div>
          </div>

          {medication.instructions && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Instructions</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{medication.instructions}</p>
            </div>
          )}
        </div>

        {/* Compartment visualizer */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">INTELLIMED Box</h2>
            <CompartmentGrid active={medication.compartment} />
            <p className="text-xs text-center text-slate-500 mt-3">
              Active compartment: <span className="font-semibold text-sky-600 dark:text-sky-400">Slot {medication.compartment}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-card-lg animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-rose-600" />
            </div>
            <h2 id="delete-title" className="text-base font-semibold text-slate-900 dark:text-slate-100 text-center mb-2">Delete Medication?</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will permanently remove <strong>{medication.name}</strong> and all future reminders. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
