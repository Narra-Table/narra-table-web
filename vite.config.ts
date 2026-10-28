import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local dev backend. Override when the API runs on another port:
// VITE_PROXY_TARGET=http://127.0.0.1:5298 pnpm dev
const apiOrigin = process.env.VITE_PROXY_TARGET?.trim() || 'http://127.0.0.1:5297';
const wsOrigin = apiOrigin.replace(/^http/, 'ws');
// 宿主机的 inotify 监听器耗尽时用轮询启动：VITE_WATCH_POLL=1 vp dev
const watch = process.env.VITE_WATCH_POLL === '1' ? { usePolling: true, interval: 500 } : undefined;

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  fmt: {
    ignorePatterns: [
      'dist/**',
      '*.min.js',
      'src/routeTree.gen.ts',
      'src/api/**',
      'src/mocks/index.msw.ts',
    ],
    sortImports: {
      newlinesBetween: false,
    },
    singleQuote: true,
    printWidth: 100,
    semi: true,
    tabWidth: 2,
  },
  lint: {
    ignorePatterns: ['src/api/**', 'src/mocks/index.msw.ts'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    plugins: ['react', 'typescript'],
    jsPlugins: [
      {
        name: '@tanstack/query',
        specifier: '@tanstack/eslint-plugin-query',
      },
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': 'warn',
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/stable-query-client': 'error',
      '@tanstack/query/prefer-query-options': 'error',
      '@tanstack/query/no-unstable-deps': 'error',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replaceAll('\\', '/');
          if (
            path.includes('/node_modules/@tiptap/') ||
            path.includes('/node_modules/prosemirror')
          ) {
            return 'editor';
          }
          if (
            path.includes('/src/features/workbench/core/') ||
            path.includes('/src/features/workbench/react/')
          ) {
            return 'workbench-wm';
          }
          if (path.includes('/src/features/workbench/')) {
            return 'workbench';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    watch,
    proxy: {
      '/api': { target: apiOrigin, changeOrigin: true },
      '/admin': {
        target: apiOrigin,
        changeOrigin: true,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
      '/auth': { target: apiOrigin, changeOrigin: true },
      '/capabilities': { target: apiOrigin, changeOrigin: true },
      '/health': { target: apiOrigin, changeOrigin: true },
      '/ws': { target: wsOrigin, ws: true },
    },
  },
});
