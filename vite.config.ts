import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  plugins: [react()],
  fmt: {
    ignorePatterns: ['dist/**', '*.min.js'],
    sortImports: {
      newlinesBetween: false,
    },
    singleQuote: true,
    printWidth: 100,
    semi: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    plugins: ['react', 'typescript'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': 'warn',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
