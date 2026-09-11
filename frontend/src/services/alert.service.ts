import type { Alert } from '@/types';
import apiClient, { USE_MOCK } from './api';
import { MOCK_ALERTS } from '@/mock/alerts';

export const alertService = {
  async getAll(): Promise<Alert[]> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250));
      return [...MOCK_ALERTS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const { data } = await apiClient.get<Alert[]>('/alerts');
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    if (USE_MOCK) {
      const alert = MOCK_ALERTS.find(a => a.id === id);
      if (alert) alert.isRead = true;
      return;
    }
    await apiClient.patch(`/alerts/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    if (USE_MOCK) {
      MOCK_ALERTS.forEach(a => (a.isRead = true));
      return;
    }
    await apiClient.post('/alerts/mark-all-read');
  },

  async getUnread(): Promise<Alert[]> {
    if (USE_MOCK) {
      return MOCK_ALERTS.filter(a => !a.isRead);
    }
    const { data } = await apiClient.get<Alert[]>('/alerts/unread');
    return data;
  },
};
