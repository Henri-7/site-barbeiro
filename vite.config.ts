import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../tests/setup.ts'],
    include: ['../tests/**/*.{test,spec}.{ts,tsx,js,jsx}']
  }
});
