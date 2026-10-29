import { defineConfig } from 'orval';

const admin = {
  mutator: { path: './src/lib/adminApiClient.ts', name: 'adminFetch' },
  fetch: { includeHttpResponseReturnType: false },
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
        generators: [{ type: 'msw', path: './src/mocks/' }],
      },
      override: {
        tags: { 管理: admin, Management: admin },
        mutator: {
          path: './src/lib/apiClient.ts',
          name: 'orvalFetch',
        },
      },
    },
  },
});
