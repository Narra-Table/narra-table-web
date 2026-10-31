import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getGetApiSpacesSpaceIdPluginAssetsNamePathUrl } from '@/api';
import type { GithubComNarraTableBackendPkgProtocolWindowOpenNotice } from '@/api/model';
import {
  getGetApiSpacesSpaceIdAppsAppIdDataResponseMock,
  getGetApiSpacesSpaceIdExportResponseMock,
  getGetApiSpacesSpaceIdPluginAssetsNamePathMockHandler,
} from './index.msw';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('generated plugin asset mocks', () => {
  it.each(['icon.png', 'assets/icon.png', 'assets/maps/first%20floor.png'])(
    'serves original bytes for %s',
    async (path) => {
      const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0x80]);
      server.use(getGetApiSpacesSpaceIdPluginAssetsNamePathMockHandler(bytes.buffer));
      const url = getGetApiSpacesSpaceIdPluginAssetsNamePathUrl('space', 'plugin', path, {
        sha256: 'content-hash',
      });
      const response = await fetch(`http://api.test${url}`);
      expect(response.status).toBe(200);
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    },
  );

  it('does not consume another API route or an empty asset path', async () => {
    const handler = getGetApiSpacesSpaceIdPluginAssetsNamePathMockHandler();
    for (const path of ['/api/spaces/space/apps', '/api/spaces/space/plugin-assets/plugin/']) {
      expect(await handler.test({ request: new Request(`http://api.test${path}`) })).toBe(false);
    }
  });
});

describe('arbitrary JSON contracts', () => {
  const values = [{ hp: 12 }, [1, 'mixed', null], 'text', 12.5, true, null];
  it.each(values.map((value) => [JSON.stringify(value), value] as const))(
    'supports the wire value %s in app data, exports and window notices',
    (_, value) => {
      const data = getGetApiSpacesSpaceIdAppsAppIdDataResponseMock({ found: true, value });
      const exported = getGetApiSpacesSpaceIdExportResponseMock({
        pluginData: [{ plugin: 'cards', key: 'state', value }],
        workspaceConfig: [{ plugin: 'cards', key: 'setting', value }],
      });
      const notice: GithubComNarraTableBackendPkgProtocolWindowOpenNotice = {
        appId: 'cards',
        windowId: 'sheet',
        params: value,
      };
      expect(data.value).toEqual(value);
      expect(exported.pluginData?.[0].value).toEqual(value);
      expect(exported.workspaceConfig?.[0].value).toEqual(value);
      expect(JSON.parse(JSON.stringify(notice)).params).toEqual(value);
    },
  );
});
