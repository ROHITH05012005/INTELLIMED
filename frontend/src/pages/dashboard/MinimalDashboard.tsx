import React, { useState, useEffect, useRef } from 'react';
import {
  Pill,
  Clock,
  Bell,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Reminder {
  id: string;
  medicineName: string;
  time: string; // "HH:MM" e.g. "14:30"
  dosage: string;
  enabled: boolean;
  takenToday: boolean;
}

// Simple Web Audio API chime generator
function playNotificationChime() {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(659.25, now + 0.15);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  } catch {
    // Audio context may be restricted before user interaction
  }
}

export default function MinimalDashboard() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('intellimed_reminders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: '1',
        medicineName: 'Paracetamol',
        time: '08:00',
        dosage: '1 Tablet after breakfast',
        enabled: true,
        takenToday: true,
      },
      {
        id: '2',
        medicineName: 'Amoxicillin',
        time: '14:00',
        dosage: '1 Capsule after lunch',
        enabled: true,
        takenToday: false,
      },
      {
        id: '3',
        medicineName: 'Vitamin D3',
        time: '20:30',
        dosage: '1 Tablet with milk',
        enabled: true,
        takenToday: false,
      },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [backendSynced, setBackendSynced] = useState(false);

  // New Reminder Form Inputs
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('12:00');
  const [newMedDosage, setNewMedDosage] = useState('');

  // Active Alert Trigger state
  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastTriggeredMinute = useRef<string>('');

  // Fetch reminders from backend API on mount
  const fetchRemindersFromBackend = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : json.data;
        if (Array.isArray(data) && data.length > 0) {
          setReminders(data);
          localStorage.setItem('intellimed_reminders', JSON.stringify(data));
          setBackendSynced(true);
        }
      }
    } catch {
      // Offline / fallback to localStorage
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemindersFromBackend();
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('intellimed_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Clock & Alarm monitor: checks every 5 seconds
  useEffect(() => {
    const checkAlarm = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (lastTriggeredMinute.current === currentTimeStr) return;

      const matched = reminders.find(
        (r) => r.enabled && r.time === currentTimeStr && !r.takenToday
      );

      if (matched) {
        lastTriggeredMinute.current = currentTimeStr;
        triggerAlarm(matched);
      }
    };

    const interval = setInterval(checkAlarm, 5000);
    return () => clearInterval(interval);
  }, [reminders, soundEnabled]);

  const triggerAlarm = (reminder: Reminder) => {
    setActiveAlert(reminder);

    if (soundEnabled) {
      playNotificationChime();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`⏰ Time for ${reminder.medicineName}!`, {
        body: `${reminder.dosage || 'Please take your scheduled medicine.'} (Scheduled for ${formatTime12h(reminder.time)})`,
        icon: '/favicon.svg',
      });
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedTime) return;

    const payload = {
      medicineName: newMedName.trim(),
      time: newMedTime,
      dosage: newMedDosage.trim() || '1 Dose',
    };

    // Optimistic local update
    const tempReminder: Reminder = {
      id: Date.now().toString(),
      ...payload,
      enabled: true,
      takenToday: false,
    };
    setReminders((prev) => [...prev, tempReminder]);
    setNewMedName('');
    setNewMedDosage('');

    // Sync to backend
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setBackendSynced(true);
      }
    } catch {
      // Local copy saved
    }
  };

  const handleDeleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));

    try {
      await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
    } catch {
      // Handled locally
    }
  };

  const handleToggleReminder = async (id: string) => {
    const item = reminders.find((r) => r.id === id);
    if (!item) return;
    const newEnabled = !item.enabled;

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: newEnabled } : r))
    );

    try {
      await fetch('/api/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: newEnabled }),
      });
    } catch {
      // Handled locally
    }
  };

  const handleMarkTaken = async (id: string) => {
    const item = reminders.find((r) => r.id === id);
    if (!item) return;
    const newTaken = !item.takenToday;

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, takenToday: newTaken } : r))
    );
    if (activeAlert?.id === id) {
      setActiveAlert(null);
    }

    try {
      await fetch('/api/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, takenToday: newTaken }),
      });
    } catch {
      // Handled locally
    }
  };

  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mStr} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                INTELLIMED
              </h1>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {backendSynced ? 'Backend Connected' : 'Medicine Reminder'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Chime Sound Enabled' : 'Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* ── Active Alarm Modal Alert ── */}
        {activeAlert && (
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 text-white p-5 rounded-3xl shadow-xl animate-bounce flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6 animate-pulse text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-amber-100">
                  Time for Medicine!
                </span>
                <h3 className="font-extrabold text-lg leading-tight">
                  {activeAlert.medicineName}
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  {activeAlert.dosage} • {formatTime12h(activeAlert.time)}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleMarkTaken(activeAlert.id)}
              className="px-4 py-2 bg-white text-rose-600 rounded-2xl font-bold text-xs shadow-md hover:bg-rose-50 transition-colors shrink-0"
            >
              Taken ✓
            </button>
          </div>
        )}

        {/* ── Add Medicine & Time Form ── */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-500" />
            Set Medicine & Notification Time
          </h2>

          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Medicine Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol, Metformin, Vitamin C"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Notification Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="time"
                    required
                    value={newMedTime}
                    onChange={(e) => setNewMedTime(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Dosage / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 Tablet after food"
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Save Medicine Reminder
            </button>
          </form>
        </section>

        {/* ── Saved Reminders List ── */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Your Reminders ({reminders.length})
              </h2>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 text-sky-500 animate-spin" />}
            </div>

            <button
              onClick={() => {
                if (reminders.length > 0) {
                  triggerAlarm(reminders[0]);
                }
              }}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
            >
              Test Notification
            </button>
          </div>

          {reminders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No medicine reminders set yet. Add one above!
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`py-4 flex items-center justify-between gap-3 transition-opacity ${
                    !reminder.enabled ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleMarkTaken(reminder.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        reminder.takenToday
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500'
                      }`}
                      title={reminder.takenToday ? 'Marked as Taken' : 'Click to mark as taken'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-sm ${reminder.takenToday ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {reminder.medicineName}
                        </h3>
                        {reminder.takenToday && (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-semibold">
                            Taken
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {reminder.dosage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono font-bold text-xs border border-sky-200/60 dark:border-sky-800/50">
                      {formatTime12h(reminder.time)}
                    </span>

                    {/* Enable / Disable switch */}
                    <button
                      onClick={() => handleToggleReminder(reminder.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        reminder.enabled
                          ? 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={reminder.enabled ? 'Notifications Enabled' : 'Notifications Muted'}
                    >
                      {reminder.enabled ? <Bell className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        INTELLIMED • Simple Medicine Reminder
      </footer>
    </div>
  );
}
