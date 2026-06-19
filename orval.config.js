import { defineConfig } from 'orval';

export default defineConfig({
  narratable: {
    input: {
      target: 'https://api.narratable.sheyiyuan.cn/swagger/doc.json',
    },
    output: {
      target: './src/api/index.ts',
      schemas: './src/api/model',
      client: 'react-query',
      mock: {
        generators: [{ type: 'msw', path: './src/mocks/' }],
      },
      override: {
        mutator: {
          path: './src/lib/orvalClient.ts',
          name: 'orvalFetch',
        },
      },
    },
  },
});
