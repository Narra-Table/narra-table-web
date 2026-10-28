const ACCESS_TOKEN_KEY = 'auth-token';
const REFRESH_TOKEN_KEY = 'auth-refresh-token';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: unknown;
};

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthSession(
  session: Partial<AuthSession> & { accessToken?: string; refreshToken?: string },
): void {
  if (!session.accessToken || !session.refreshToken) {
    clearAuth();
    throw new Error('Authentication response did not contain token pair');
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        clearAuth();
        return null;
      }
      const session = (await response.json()) as AuthSession;
      setAuthSession(session);
      return session.accessToken;
    })
    .catch(() => {
      clearAuth();
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
