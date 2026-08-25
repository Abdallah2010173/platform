import { UserRole } from '@platform/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'authUser';

export function getStoredTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession(
  accessToken: string,
  refreshToken: string,
  user: AuthUser,
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAccessTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return true;
  }
}

/**
 * Map a user role to its dashboard route.
 */
export function roleToRoute(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.TEACHER:
      return '/teacher';
    case UserRole.STUDENT:
      return '/student';
    default:
      return '/';
  }
}

/**
 * Determine whether a user is allowed to access the given route.
 * Used by ProtectedRoute / RoleGuard.
 */
export function canAccessRoute(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const route = roleToRoute(role);
  // Allow the user to reach their own dashboard and any nested content under it.
  if (pathname === route || pathname.startsWith(`${route}/`)) {
    return true;
  }
  // Not allowed to access other role dashboards.
  return false;
}
