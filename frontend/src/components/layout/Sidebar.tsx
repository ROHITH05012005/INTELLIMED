import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Pill, Users, TrendingUp, Bell, Cpu, Settings, User,
  Calendar, ClipboardList, LogOut, ChevronRight, Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NAV_BY_ROLE } from '@/constants';
import { cn } from '@/utils/cn';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Pill,
  Users,
  TrendingUp,
  Bell,
  Cpu,
  Settings,
  User,
  Calendar,
  ClipboardList,
  Activity,
};

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const navItems = user ? NAV_BY_ROLE[user.role] : [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col h-full bg-slate-900 dark:bg-slate-950 w-64 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-600 shadow-lg shadow-sky-600/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">INTELLIMED</h1>
          <p className="text-[10px] text-slate-500 tracking-wide">Smart Medication</p>
        </div>
      </div>

      {/* Role badge */}
      {user && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60">
            <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Activity;
          const isAlerts = item.path === '/alerts';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'nav-item group relative',
                  isActive && 'nav-item-active'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isAlerts && unreadCount > 0 && (
                    <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={12} className="text-sky-500 flex-shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-0.5">
        <button
          onClick={handleLogout}
          className="nav-item w-full text-left hover:bg-rose-900/30 hover:text-rose-400 group"
          aria-label="Sign out"
        >
          <LogOut size={16} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
