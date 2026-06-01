import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['**/*.test.{ts,js,mjs,cjs,tsx,jsx}', '**/*.spec.{ts,js,mjs,cjs,tsx,jsx}'],
      exclude: ['node_modules', 'dist'],
    },
  }),
);
