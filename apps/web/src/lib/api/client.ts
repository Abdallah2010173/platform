import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthUser } from '@/lib/auth';

// ضمان إضافة /api/v1 دائماً لتفادي خطأ 404
const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:4000';
export const API_URL = rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl}/api/v1`;

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

export async function refreshAccessTokenRequest(refreshToken: string): Promise<string | null> {
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const tokens = res.data?.data ?? res.data;
    if (tokens?.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);
      return tokens.accessToken;
    }
  } catch {
    // The caller clears the local session when renewal fails.
  }
  return null;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;
      return await refreshAccessTokenRequest(refreshToken);
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

export interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export async function loginRequest(email: string, password: string): Promise<LoginApiResponse> {
  const res = await apiClient.post('/auth/login', { email, password });
  const payload = res.data?.data ?? res.data;
  return payload as LoginApiResponse;
}

export async function logoutRequest(): Promise<void> {
  if (typeof window === 'undefined') return;

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) return;

  try {
    await axios.post(
      `${API_URL}/auth/logout`,
      { refreshToken },
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        withCredentials: true,
      },
    );
  } catch {
    // Ignore logout failures
  }
}

export function getApiData<T>(response: { data: unknown }): T {
  const body = response.data as { data?: T };
  return body?.data ?? (response.data as T);
}