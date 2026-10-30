/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { orvalFetch } from './apiClient';
import { setAuthSession } from './authSession';
import { subscribeSessionExpiry } from './sessionExpiry';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('player API transport authentication', () => {
  it('keeps a login 401 as a form error without expiring the session', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSessionExpiry(listener);
    fetchMock.mockResolvedValue(Response.json({ message: 'invalid credentials' }, { status: 401 }));

    await expect(
      orvalFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'player', password: 'wrong' }),
      }),
    ).rejects.toMatchObject({ status: 401, authScope: 'user' });

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('expires the player session when refreshing a protected request fails', async () => {
    setAuthSession({ accessToken: 'expired', refreshToken: 'expired-refresh' });
    const listener = vi.fn();
    const unsubscribe = subscribeSessionExpiry(listener);
    fetchMock
      .mockResolvedValueOnce(Response.json({ message: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ message: 'expired' }, { status: 401 }));

    await expect(orvalFetch('/api/me', { method: 'GET' })).rejects.toMatchObject({ status: 401 });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith('user');
    unsubscribe();
  });
});
