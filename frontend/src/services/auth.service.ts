import type { AuthResponse, LoginCredentials, User } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import apiClient, { USE_MOCK } from './api';

// ─── Mock users ────────────────────────────────────────────────
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'patient@intellimed.com': {
    password: 'Patient@123',
    user: {
      id: 'u-patient-001',
      email: 'patient@intellimed.com',
      name: 'Sarah Johnson',
      role: 'patient',
      phone: '+91 98765 43210',
      createdAt: '2026-01-15T10:00:00.000Z',
      lastLogin: new Date().toISOString(),
    },
  },
  'caregiver@intellimed.com': {
    password: 'Caregiver@123',
    user: {
      id: 'u-caregiver-001',
      email: 'caregiver@intellimed.com',
      name: 'Dr. Aisha Patel',
      role: 'caregiver',
      phone: '+91 87654 32109',
      createdAt: '2026-01-10T09:00:00.000Z',
      lastLogin: new Date().toISOString(),
    },
  },
  'admin@intellimed.com': {
    password: 'Admin@123',
    user: {
      id: 'u-admin-001',
      email: 'admin@intellimed.com',
      name: 'System Administrator',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString(),
    },
  },
};

// ─── Auth Service ──────────────────────────────────────────────
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 800)); // simulate network delay
      const entry = MOCK_USERS[credentials.email];
      if (!entry || entry.password !== credentials.password) {
        throw new Error('Invalid email or password. Please try again.');
      }
      const token = `mock_token_${Date.now()}`;
      return { user: entry.user, token, refreshToken: `mock_refresh_${Date.now()}` };
    }
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async logout(): Promise<void> {
    if (!USE_MOCK) {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  async getMe(): Promise<User> {
    if (USE_MOCK) {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) return JSON.parse(stored) as User;
      throw new Error('Not authenticated');
    }
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  persistAuth(authResponse: AuthResponse, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authResponse.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authResponse.user));
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? (JSON.parse(stored) as User) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser();
  },

  getMockCredentials(): { email: string; password: string; role: string }[] {
    return [
      { email: 'patient@intellimed.com', password: 'Patient@123', role: 'Patient' },
      { email: 'caregiver@intellimed.com', password: 'Caregiver@123', role: 'Caregiver' },
      { email: 'admin@intellimed.com', password: 'Admin@123', role: 'Admin' },
    ];
  },
};
