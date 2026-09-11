import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientContext } from '@/contexts/PatientContext';
import { medicationService } from '@/services/medication.service';
import { DOSAGE_UNITS, FREQUENCY_LABELS } from '@/constants';
import { cn } from '@/utils/cn';

const medicationSchema = z.object({
  name: z.string().min(2, 'Medicine name is required').max(100),
  genericName: z.string().optional(),
  dose: z.number({ invalid_type_error: 'Dose must be a number' }).positive('Dose must be positive'),
  unit: z.enum(['mg', 'ml', 'tablet', 'capsule', 'drops', 'puff', 'unit']),
  compartment: z.number().int().min(1).max(6),
  frequency: z.enum(['once', 'daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'weekly', 'custom']),
  scheduledTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')).min(1, 'At least one time required'),
  instructions: z.string().max(500).optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().optional(),
  prescribedBy: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

const FREQUENCY_TIME_COUNT: Record<string, number> = {
  once: 1, daily: 1, twice_daily: 2,
  three_times_daily: 3, four_times_daily: 4, weekly: 1, custom: 1,
};

export default function NewMedicationPage() {
  const { user, patientId } = useAuth();
  const { selectedPatient } = usePatientContext();
  const navigate = useNavigate();
  const activePatientId = user?.role === 'patient' ? patientId : selectedPatient?.id;

  const [times, setTimes] = useState<string[]>(['08:00']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      unit: 'mg',
      compartment: 1,
      frequency: 'daily',
      scheduledTimes: ['08:00'],
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const frequency = watch('frequency');

  const updateTimesForFrequency = (freq: string) => {
    const count = FREQUENCY_TIME_COUNT[freq] ?? 1;
    const defaultTimes = ['08:00', '13:00', '20:00', '22:00'];
    const newTimes = defaultTimes.slice(0, count);
    setTimes(newTimes);
    setValue('scheduledTimes', newTimes);
  };

  const addTime = () => {
    const newTimes = [...times, '12:00'];
    setTimes(newTimes);
    setValue('scheduledTimes', newTimes);
  };

  const removeTime = (idx: number) => {
    const newTimes = times.filter((_, i) => i !== idx);
    setTimes(newTimes);
    setValue('scheduledTimes', newTimes);
  };

  const updateTime = (idx: number, value: string) => {
    const newTimes = times.map((t, i) => i === idx ? value : t);
    setTimes(newTimes);
    setValue('scheduledTimes', newTimes);
  };

  const onSubmit = async (data: MedicationFormData) => {
    if (!activePatientId) return;
    setIsSubmitting(true);
    try {
      await medicationService.create({
        ...data,
        patientId: activePatientId,
        status: 'active',
        category: undefined,
        color: undefined,
      } as any);
      navigate('/medications');
    } catch {
      // handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2" aria-label="Go back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Add Medication</h1>
          <p className="page-subtitle">Add a new medication to the schedule</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Medication Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="label block mb-1.5">Medicine Name *</label>
              <input id="name" className={cn('input', errors.name && 'input-error')}
                placeholder="e.g., Metformin" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="genericName" className="label block mb-1.5">Generic Name</label>
              <input id="genericName" className="input" placeholder="e.g., Metformin HCl" {...register('genericName')} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dose" className="label block mb-1.5">Dose *</label>
              <input id="dose" type="number" step="0.1" className={cn('input', errors.dose && 'input-error')}
                placeholder="500" {...register('dose', { valueAsNumber: true })} />
              {errors.dose && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.dose.message}</p>}
            </div>
            <div>
              <label htmlFor="unit" className="label block mb-1.5">Unit *</label>
              <select id="unit" className="input" {...register('unit')}>
                {DOSAGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="compartment" className="label block mb-1.5">Compartment *</label>
              <select id="compartment" className="input" {...register('compartment', { valueAsNumber: true })}>
                {Array.from({ length: 6 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Slot {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prescribedBy" className="label block mb-1.5">Prescribed By</label>
            <input id="prescribedBy" className="input" placeholder="Doctor's name" {...register('prescribedBy')} />
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Schedule</h2>

          <div>
            <label htmlFor="frequency" className="label block mb-1.5">Frequency *</label>
            <select
              id="frequency"
              className="input"
              {...register('frequency')}
              onChange={e => {
                register('frequency').onChange(e);
                updateTimesForFrequency(e.target.value);
              }}
            >
              {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Scheduled times */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label">Scheduled Times *</label>
              <button type="button" onClick={addTime} className="btn-ghost text-xs gap-1">
                <Plus size={13} /> Add time
              </button>
            </div>
            <div className="space-y-2">
              {times.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={t}
                    onChange={e => updateTime(idx, e.target.value)}
                    className="input flex-1"
                    aria-label={`Scheduled time ${idx + 1}`}
                  />
                  {times.length > 1 && (
                    <button type="button" onClick={() => removeTime(idx)} className="btn-ghost p-2" aria-label="Remove time">
                      <Trash2 size={14} className="text-rose-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.scheduledTimes && (
              <p className="mt-1 text-xs text-rose-600" role="alert">At least one scheduled time is required</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="label block mb-1.5">Start Date *</label>
              <input id="startDate" type="date" className="input" {...register('startDate')} />
            </div>
            <div>
              <label htmlFor="endDate" className="label block mb-1.5">End Date (optional)</label>
              <input id="endDate" type="date" className="input" {...register('endDate')} />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Instructions</h2>
          <textarea
            id="instructions"
            rows={3}
            className="input resize-none"
            placeholder="Special instructions (e.g., take with food, do not crush)..."
            {...register('instructions')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Add Medication'}
          </button>
        </div>
      </form>
    </div>
  );
}
