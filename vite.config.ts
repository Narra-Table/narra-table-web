import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    ignorePatterns: ['dist/**', '*.min.js', 'src/routeTree.gen.ts'],
    sortImports: {
      newlinesBetween: false,
    },
    singleQuote: true,
    printWidth: 100,
    semi: true,
    tabWidth: 2,
  },
  lint: {
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
});
