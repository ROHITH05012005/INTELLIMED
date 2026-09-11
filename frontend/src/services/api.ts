import axios, { type AxiosInstance, type AxiosResponse, AxiosError } from 'axios';
import { STORAGE_KEYS } from '@/constants';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

// ─── Axios Instance ────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor — inject auth token ───────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — normalize errors ──────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(normalizeError(error));
  }
);

// ─── Error normalization ────────────────────────────────────────
export interface NormalizedError {
  message: string;
  code?: string;
  statusCode?: number;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; detail?: string } | undefined;
    return {
      message: data?.message ?? data?.detail ?? error.message ?? 'An unexpected error occurred',
      statusCode: error.response?.status,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'An unexpected error occurred' };
}

// ─── Mock check ────────────────────────────────────────────────
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default apiClient;
