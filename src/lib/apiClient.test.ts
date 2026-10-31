/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getApiMe,
  getApiResourcesIdFile,
  getApiSpacesSpaceIdPluginAssetsNamePath,
  getApiSpacesSpaceIdResourcesResourceIdDownload,
} from '@/api';
import { setAuthSession } from './authSession';

const fetchMock = vi.fn<typeof fetch>();
const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0x80]);

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  // jsdom's Blob implements FileReader, but does not implement Blob.arrayBuffer().
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  setAuthSession({ accessToken: 'player-token', refreshToken: 'player-refresh' });
});

afterEach(() => vi.unstubAllGlobals());

describe('generated file API', () => {
  it('preserves bytes and MIME types for plugin and uploaded resources', async () => {
    fetchMock.mockImplementation(
      async () => new Response(bytes, { headers: { 'Content-Type': 'image/png' } }),
    );
    const responses = [
      await getApiSpacesSpaceIdPluginAssetsNamePath('space', 'plugin', 'assets/map.png'),
      await getApiResourcesIdFile('resource'),
      await getApiSpacesSpaceIdResourcesResourceIdDownload('space', 'resource'),
    ];
    for (const response of responses) {
      if (response.status !== 200) throw new Error('expected success');
      expect(response.data).toBeInstanceOf(Blob);
      expect(new Uint8Array(await readBlob(response.data))).toEqual(bytes);
      expect(response.data.type).toBe('image/png');
    }
    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer player-token');
    }
  });

  it('keeps a JSON asset as a file while normal API responses remain JSON', async () => {
    fetchMock.mockImplementation(async () => Response.json({ hp: 12 }));
    const asset = await getApiSpacesSpaceIdPluginAssetsNamePath(
      'space',
      'plugin',
      'assets/card.json',
    );
    if (asset.status !== 200) throw new Error('expected success');
    expect(new TextDecoder().decode(await readBlob(asset.data))).toBe('{"hp":12}');
    expect((await getApiMe()).data).toEqual({ hp: 12 });
  });

  it('refreshes a user session before retrying a binary download', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ message: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(
        Response.json({
          accessToken: 'fresh-token',
          refreshToken: 'fresh-refresh',
          expiresIn: 3600,
        }),
      )
      .mockResolvedValueOnce(new Response(bytes));
    const response = await getApiSpacesSpaceIdPluginAssetsNamePath(
      'space',
      'plugin',
      'assets/map.png',
    );
    if (response.status !== 200) throw new Error('expected success');
    expect(new Uint8Array(await readBlob(response.data))).toEqual(bytes);
    expect(fetchMock.mock.calls[1][0]).toBe('/auth/refresh');
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get('Authorization')).toBe(
      'Bearer fresh-token',
    );
  });

  it('decodes a JSON download error without treating it as a file', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'forbidden' }, { status: 403 }));
    await expect(
      getApiSpacesSpaceIdPluginAssetsNamePath('space', 'plugin', 'assets/map.png'),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'forbidden',
      body: { message: 'forbidden' },
      authScope: 'user',
    });
  });

  it('returns a conditional 304 without attempting to decode an asset body', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 304, headers: { ETag: 'asset-hash' } }),
    );
    expect(
      await getApiSpacesSpaceIdPluginAssetsNamePath(
        'space',
        'plugin',
        'assets/map.png',
        undefined,
        {
          headers: { 'If-None-Match': 'asset-hash' },
        },
      ),
    ).toMatchObject({ status: 304, data: undefined });
  });
});
