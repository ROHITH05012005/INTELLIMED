import type { Device } from '@/types';
import apiClient, { USE_MOCK } from './api';
import { MOCK_DEVICES, getMockDeviceByPatient, getMockDeviceById } from '@/mock/devices';

export const deviceService = {
  async getAll(): Promise<Device[]> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_DEVICES;
    }
    const { data } = await apiClient.get<Device[]>('/devices');
    return data;
  },

  async getById(id: string): Promise<Device> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200));
      const device = getMockDeviceById(id);
      if (!device) throw new Error('Device not found');
      return device;
    }
    const { data } = await apiClient.get<Device>(`/devices/${id}`);
    return data;
  },

  async getByPatient(patientId: string): Promise<Device | null> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200));
      return getMockDeviceByPatient(patientId) ?? null;
    }
    const { data } = await apiClient.get<Device>(`/patients/${patientId}/device`);
    return data;
  },

  async triggerSync(deviceId: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 1000));
      return;
    }
    await apiClient.post(`/devices/${deviceId}/sync`);
  },
};
