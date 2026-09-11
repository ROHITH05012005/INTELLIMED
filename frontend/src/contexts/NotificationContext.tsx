import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Alert } from '@/types';
import { alertService } from '@/services/alert.service';

interface NotificationContextValue {
  alerts: Alert[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await alertService.getAll();
      setAlerts(data);
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 60 seconds to simulate live updates
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markAsRead = useCallback(async (id: string) => {
    await alertService.markAsRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await alertService.markAllAsRead();
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  }, []);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <NotificationContext.Provider value={{ alerts, unreadCount, markAsRead, markAllAsRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
