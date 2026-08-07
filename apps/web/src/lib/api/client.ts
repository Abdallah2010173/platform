import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthUser } from '@/lib/auth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://platformapi-production-c6d1.up.railway.app/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      // The global TransformInterceptor wraps responses: { success, data, timestamp }
      const body = res.data;
      const tokens = body?.data ?? body;
      const newAccessToken = tokens?.accessToken ?? null;
      const newRefreshToken = tokens?.refreshToken ?? null;
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
      }
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      return newAccessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      // Refresh failed — clear session and redirect to login.
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authUser');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// Re-export usage-friendly helpers
export interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export async function loginRequest(email: string, password: string): Promise<LoginApiResponse> {
  const res = await apiClient.post('/auth/login', { email, password });
  // TransformInterceptor envelope: { success, data, timestamp }
  const payload = res.data?.data ?? res.data;
  return payload as LoginApiResponse;
}

export function getApiData<T>(response: { data: unknown }): T {
  const body = response.data as { data?: T };
  return body?.data ?? (response.data as T);
}
