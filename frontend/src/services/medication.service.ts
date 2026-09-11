import type { Medication, DoseLog, DashboardMetrics } from '@/types';
import apiClient, { USE_MOCK } from './api';
import { getMockMedicationsByPatient, getMockMedicationById, MOCK_MEDICATIONS } from '@/mock/medications';
import { getMockDoseLogsByPatient, getMockTodayDoseLogs } from '@/mock/doseLogs';
import { getMockDashboardMetrics } from '@/mock/dashboard';

export const medicationService = {
  async getByPatient(patientId: string): Promise<Medication[]> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return getMockMedicationsByPatient(patientId);
    }
    const { data } = await apiClient.get<Medication[]>(`/patients/${patientId}/medications`);
    return data;
  },

  async getById(id: string): Promise<Medication> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200));
      const med = getMockMedicationById(id);
      if (!med) throw new Error('Medication not found');
      return med;
    }
    const { data } = await apiClient.get<Medication>(`/medications/${id}`);
    return data;
  },

  async create(medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      const newMed: Medication = {
        ...medication,
        id: `med-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_MEDICATIONS.push(newMed);
      return newMed;
    }
    const { data } = await apiClient.post<Medication>('/medications', medication);
    return data;
  },

  async update(id: string, updates: Partial<Medication>): Promise<Medication> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      const idx = MOCK_MEDICATIONS.findIndex(m => m.id === id);
      if (idx === -1) throw new Error('Medication not found');
      MOCK_MEDICATIONS[idx] = { ...MOCK_MEDICATIONS[idx], ...updates, updatedAt: new Date().toISOString() };
      return MOCK_MEDICATIONS[idx];
    }
    const { data } = await apiClient.patch<Medication>(`/medications/${id}`, updates);
    return data;
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      const idx = MOCK_MEDICATIONS.findIndex(m => m.id === id);
      if (idx !== -1) MOCK_MEDICATIONS.splice(idx, 1);
      return;
    }
    await apiClient.delete(`/medications/${id}`);
  },

  async getDoseLogs(patientId: string): Promise<DoseLog[]> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return getMockDoseLogsByPatient(patientId);
    }
    const { data } = await apiClient.get<DoseLog[]>(`/patients/${patientId}/dose-logs`);
    return data;
  },

  async getTodayDoseLogs(patientId: string): Promise<DoseLog[]> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200));
      return getMockTodayDoseLogs(patientId);
    }
    const { data } = await apiClient.get<DoseLog[]>(`/patients/${patientId}/dose-logs/today`);
    return data;
  },

  async getDashboardMetrics(patientId: string): Promise<DashboardMetrics> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250));
      const metrics = getMockDashboardMetrics(patientId);
      if (!metrics) throw new Error('No metrics for patient');
      return metrics;
    }
    const { data } = await apiClient.get<DashboardMetrics>(`/patients/${patientId}/dashboard`);
    return data;
  },
};
