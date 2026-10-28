const TOKEN_KEY = 'narratable-admin-token';
const FORCE_KEY = 'narratable-admin-force-change';

export type AdminSession = {
  token: string;
  forceChangePassword: boolean;
};

export function getAdminSession(): AdminSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  return {
    token,
    forceChangePassword: sessionStorage.getItem(FORCE_KEY) === '1',
  };
}

export function setAdminSession(token: string, forceChangePassword: boolean): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(FORCE_KEY, forceChangePassword ? '1' : '0');
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(FORCE_KEY);
}
