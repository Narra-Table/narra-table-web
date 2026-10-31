import { generateMock } from '@orval/mock';
import { defineConfig } from 'orval';

const admin = {
  mutator: { path: './src/lib/adminApiClient.ts', name: 'adminFetch' },
  fetch: { includeHttpResponseReturnType: false },
};

const invocation = {
  mutator: { path: './src/lib/invocationApiClient.ts', name: 'invocationFetch' },
};

const binary = {
  mutator: { path: './src/lib/apiClient.ts', name: 'orvalBlobFetch' },
};

export default defineConfig({
  narratable: {
    input: {
      target:
        process.env.NARRATABLE_OPENAPI ?? 'https://api.narratable.sheyiyuan.cn/swagger/doc.json',
    },
    output: {
      target: './src/api/index.ts',
      schemas: './src/api/model',
      client: 'react-query',
      mock: {
        path: './src/mocks/',
        generators: [
          (operation, options) =>
            generateMock(operation, {
              ...options,
              // The backend's *path includes directories inside a plugin package.
              pathRoute:
                operation.operationName === 'getApiSpacesSpaceIdPluginAssetsNamePath'
                  ? options.pathRoute.replace('{path}', '{path}+')
                  : options.pathRoute,
              mock: { type: 'msw', delay: false },
            }),
        ],
      },
      override: {
        tags: { 管理: admin, Management: admin, BotInvocation: invocation },
        operations: {
          GetApiResourcesIdFile: binary,
          GetApiSpacesSpaceIdResourcesResourceIdDownload: binary,
          GetApiSpacesSpaceIdPluginAssetsNamePath: binary,
        },
        transformer: (operation) => {
          if (
            operation.tags.includes('BotInvocation') &&
            operation.body.contentType === 'application/json'
          ) {
            // The transport sets JSON Content-Type without object-spreading HeadersInit.
            return { ...operation, body: { ...operation.body, contentType: '' } };
          }
          return operation;
        },
        mutator: {
          path: './src/lib/apiClient.ts',
          name: 'orvalFetch',
        },
      },
    },
  },
});
