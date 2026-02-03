import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [repoRoot],
    },
  },

  resolve: {
    alias: {
      '@templates': path.resolve(repoRoot, 'templates'),
      '@cardsmith/core': path.resolve(repoRoot, 'packages/core/src'),
      '@cardsmith/storage': path.resolve(repoRoot, 'packages/storage/src'),
    },
  },
});
