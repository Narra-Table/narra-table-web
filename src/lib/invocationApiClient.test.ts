/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getApiBotInvocationsIdCardsCardId,
  postApiBotInvocationsIdWindows,
  putApiBotInvocationsIdCardsCardId,
} from '@/api';
import { getAdminSession, setAdminSession } from './adminSession';
import { getAccessToken, getRefreshToken, setAuthSession } from './authSession';

const fetchMock = vi.fn<typeof fetch>();
const authorization = 'Bearer invocation-token';
const headerCases: [string, () => HeadersInit][] = [
  ['object', () => ({ Authorization: authorization })],
  ['Headers', () => new Headers({ Authorization: authorization })],
  ['tuples', () => [['Authorization', authorization]]],
];

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  setAuthSession({ accessToken: 'player-token', refreshToken: 'player-refresh' });
  setAdminSession('admin-token', false);
});

afterEach(() => vi.unstubAllGlobals());

describe('generated invocation API', () => {
  it.each(headerCases)(
    'preserves invocation authentication from %s headers',
    async (_, headers) => {
      fetchMock.mockImplementation(async () => Response.json({ hp: 12 }));
      const options = { headers: headers() };
      expect(await getApiBotInvocationsIdCardsCardId('invocation', 'card', options)).toMatchObject({
        status: 200,
        data: { hp: 12 },
      });
      await putApiBotInvocationsIdCardsCardId('invocation', 'card', { data: { hp: 12 } }, options);

      for (const [, init] of fetchMock.mock.calls) {
        expect(new Headers(init?.headers).get('Authorization')).toBe(authorization);
      }
      const [, write] = fetchMock.mock.calls[1];
      expect(JSON.parse(write?.body as string)).toEqual({ data: { hp: 12 } });
      expect(new Headers(write?.headers).get('Content-Type')).toBe('application/json');
    },
  );

  it('keeps user and administrator sessions when an invocation token expires', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'invocation expired' }, { status: 401 }));
    await expect(
      getApiBotInvocationsIdCardsCardId('invocation', 'card', {
        headers: { Authorization: authorization },
      }),
    ).rejects.toMatchObject({ status: 401, message: 'invocation expired', authScope: undefined });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('player-token');
    expect(getRefreshToken()).toBe('player-refresh');
    expect(getAdminSession()?.token).toBe('admin-token');
  });

  it('does not fall back to a user or administrator token when no invocation token is supplied', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'unauthorized' }, { status: 401 }));
    await expect(getApiBotInvocationsIdCardsCardId('invocation', 'card')).rejects.toMatchObject({
      status: 401,
    });
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Authorization')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('player-token');
  });

  it('sends JSON window parameters and accepts an empty success response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const body = { appId: 'cards', windowId: 'sheet', params: { cardId: 'card' } };
    expect(
      await postApiBotInvocationsIdWindows('invocation', body, {
        headers: new Headers({ Authorization: authorization }),
      }),
    ).toMatchObject({ status: 204, data: undefined });
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get('Authorization')).toBe(authorization);
    expect(JSON.parse(init?.body as string)).toEqual(body);
  });
});
