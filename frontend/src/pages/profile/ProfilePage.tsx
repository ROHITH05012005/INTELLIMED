import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { formatShortDate } from '@/utils/formatting';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your account information</p>
      </div>

      {/* Avatar card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-sky-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user.name}</h2>
          <p className="text-sm text-slate-500 capitalize mt-0.5">{user.role}</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Account Details</h2>
        <div className="space-y-4">
          {[
            { icon: User, label: 'Full Name', value: user.name },
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Phone, label: 'Phone', value: user.phone ?? 'Not provided' },
            { icon: Shield, label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
            { icon: Calendar, label: 'Member Since', value: formatShortDate(user.createdAt) },
          ].map(row => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{row.label}</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          Profile editing will be available after backend integration.
        </p>
      </div>
    </div>
  );
}
