/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAdminDashboard,
  postAdminChangePassword,
  postAdminPlugins,
  postAdminPluginsValidate,
} from '@/api';
import type { AdminApiError } from './adminApiClient';
import { setAdminSession } from './adminSession';
import { getAccessToken, getRefreshToken, setAuthSession } from './authSession';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  setAuthSession({ accessToken: 'player-token', refreshToken: 'player-refresh' });
  setAdminSession('operator-token', false);
});

afterEach(() => vi.unstubAllGlobals());

describe('generated administrator API transport', () => {
  it('uses the administrator session and returns the documented response body', async () => {
    fetchMock.mockResolvedValue(Response.json({ userCount: 12, adminCount: 1 }));
    expect(await getAdminDashboard()).toEqual({ userCount: 12, adminCount: 1 });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/admin/dashboard');
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer operator-token');
  });

  it('does not refresh or clear the player session after an administrator 401', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ code: 'unauthorized', message: 'expired' }, { status: 401 }),
    );
    await expect(getAdminDashboard()).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 401,
      code: 'unauthorized',
      authScope: 'admin',
    } satisfies Partial<AdminApiError>);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('player-token');
    expect(getRefreshToken()).toBe('player-refresh');
  });

  it('sends the password request body declared by the backend', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'password changed' }));
    const request = { oldPassword: 'old-fixture', newPassword: 'new-fixture' };
    await postAdminChangePassword(request);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/admin/change-password');
    expect(JSON.parse(options?.body as string)).toEqual(request);
    expect(new Headers(options?.headers).get('Content-Type')).toBe('application/json');
  });

  it('uploads multipart packages and preserves an explicit enabled=false', async () => {
    fetchMock.mockImplementation(async () => Response.json({}));
    const file = new File(['package fixture'], 'example.ntp');
    await postAdminPlugins({ file, enabled: false });
    await postAdminPluginsValidate({ file });
    for (const [, options] of fetchMock.mock.calls) {
      expect(options?.body).toBeInstanceOf(FormData);
      const form = options?.body as FormData;
      expect((form.get('file') as File).name).toBe('example.ntp');
      expect(new Headers(options?.headers).has('Content-Type')).toBe(false);
    }
    const form = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(form.get('enabled')).toBe('false');
  });
});
