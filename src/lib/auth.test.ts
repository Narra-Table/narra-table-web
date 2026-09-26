import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
  setAuthSession,
} from './auth';

function installStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
}

describe('auth session', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    installStorage();
    clearAuth();
  });

  it('stores and clears the access and refresh token pair', () => {
    setAuthSession({ accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 60 });
    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');

    clearAuth();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('coalesces concurrent refresh requests and stores the rotated pair', async () => {
    setAuthSession({ accessToken: 'expired', refreshToken: 'refresh-1', expiresIn: 60 });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 60 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);

    expect(first).toBe('access-2');
    expect(second).toBe('access-2');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('access-2');
    expect(getRefreshToken()).toBe('refresh-2');
  });
});
