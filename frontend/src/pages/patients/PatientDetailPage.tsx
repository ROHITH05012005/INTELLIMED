import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Droplets, AlertCircle, Pill } from 'lucide-react';
import { patientService } from '@/services/patient.service';
import { medicationService } from '@/services/medication.service';
import { alertService } from '@/services/alert.service';
import { deviceService } from '@/services/device.service';
import { formatShortDate, formatRelativeTime } from '@/utils/formatting';
import { cn } from '@/utils/cn';
import { MedicationTimeline } from '@/components/dashboard/MedicationTimeline';
import { DeviceStatusWidget } from '@/components/dashboard/DeviceStatusWidget';
import type { Patient, Medication, Alert, Device, DoseLog } from '@/types';

type Tab = 'overview' | 'medications' | 'alerts' | 'device';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [todayLogs, setTodayLogs] = useState<DoseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      patientService.getById(id),
      medicationService.getByPatient(id),
      alertService.getAll(),
      deviceService.getByPatient(id),
      medicationService.getTodayDoseLogs(id),
    ]).then(([p, meds, als, dev, logs]) => {
      setPatient(p);
      setMedications(meds);
      setAlerts(als.filter(a => a.patientId === id));
      setDevice(dev);
      setTodayLogs(logs);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) return <div className="space-y-4 animate-pulse"><div className="h-40 skeleton rounded-xl" /><div className="h-64 skeleton rounded-xl" /></div>;
  if (!patient) return <div className="card p-12 text-center"><p className="text-sm text-slate-500">Patient not found</p></div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'medications', label: `Medications (${medications.length})` },
    { id: 'alerts', label: `Alerts (${alerts.filter(a => !a.isRead).length} unread)` },
    { id: 'device', label: 'Device' },
  ];

  const adherenceColor = patient.adherencePercent >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
    patient.adherencePercent >= 80 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-sky-700 dark:text-sky-400 text-lg font-bold">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h1 className="page-title">{patient.name}</h1>
            <p className="page-subtitle">{patient.age} years &bull; {patient.gender} &bull; {patient.bloodGroup}</p>
          </div>
          <div className="ml-auto">
            <span className={cn('badge font-semibold text-sm px-3 py-1',
              patient.status === 'critical' ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400' :
              patient.status === 'stable' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' :
              'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400'
            )}>
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              tab === t.id
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
            aria-selected={tab === t.id}
            role="tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Patient Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {patient.phone && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Phone size={13}/> {patient.phone}</div>}
                  {patient.email && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Mail size={13}/> {patient.email}</div>}
                  {patient.address && <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 col-span-2"><MapPin size={13} className="mt-0.5 flex-shrink-0"/> {patient.address}</div>}
                </div>
                {patient.conditions && patient.conditions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2 font-medium">Conditions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.conditions.map(c => <span key={c} className="badge bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400">{c}</span>)}
                    </div>
                  </div>
                )}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2 font-medium">Allergies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.map(a => <span key={a} className="badge bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"><AlertCircle size={10}/> {a}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Today's Schedule</h2>
                </div>
                <MedicationTimeline doseLogs={todayLogs} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">30-Day Adherence</p>
                <p className={cn('text-4xl font-bold', adherenceColor)}>{patient.adherencePercent}%</p>
                <p className="text-xs text-slate-500 mt-1">{patient.missedDoses} missed doses</p>
              </div>
              <DeviceStatusWidget device={device} />
            </div>
          </div>
        )}

        {tab === 'medications' && (
          <div className="space-y-3">
            {medications.length === 0 ? (
              <div className="card p-12 text-center">
                <Pill size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm text-slate-500">No medications assigned</p>
              </div>
            ) : medications.map(med => (
              <Link key={med.id} to={`/medications/${med.id}`} className="card p-4 flex items-center gap-4 hover:shadow-card-md transition-shadow block group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (med.color ?? '#0ea5e9') + '20' }}>
                  <Pill size={18} style={{ color: med.color ?? '#0ea5e9' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.dose} {med.unit} &bull; {med.scheduledTimes.map(t => t).join(', ')}</p>
                </div>
                <span className="badge bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 capitalize">{med.status}</span>
              </Link>
            ))}
          </div>
        )}

        {tab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="card p-12 text-center"><p className="text-sm text-slate-500">No alerts for this patient</p></div>
            ) : alerts.map(alert => (
              <div key={alert.id} className={cn('card p-4 border-l-4', alert.priority === 'high' ? 'border-l-rose-500' : alert.priority === 'medium' ? 'border-l-amber-500' : 'border-l-sky-500')}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-3">{formatRelativeTime(alert.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'device' && <DeviceStatusWidget device={device} />}
      </div>
    </div>
  );
}
