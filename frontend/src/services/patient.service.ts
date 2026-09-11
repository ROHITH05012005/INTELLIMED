import type { Patient } from '@/types';
import apiClient, { USE_MOCK } from './api';
import { MOCK_PATIENTS } from '@/mock/patients';

export const patientService = {
  async getAll(): Promise<Patient[]> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PATIENTS;
    }
    const { data } = await apiClient.get<Patient[]>('/patients');
    return data;
  },

  async getById(id: string): Promise<Patient> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200));
      const patient = MOCK_PATIENTS.find(p => p.id === id);
      if (!patient) throw new Error('Patient not found');
      return patient;
    }
    const { data } = await apiClient.get<Patient>(`/patients/${id}`);
    return data;
  },

  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      const patient = MOCK_PATIENTS.find(p => p.id === id);
      if (!patient) throw new Error('Patient not found');
      return { ...patient, ...updates };
    }
    const { data } = await apiClient.patch<Patient>(`/patients/${id}`, updates);
    return data;
  },
};
