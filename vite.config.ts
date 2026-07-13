import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const sourceDirectory = decodeURIComponent(new URL('./src', import.meta.url).pathname);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    fs: {
      strict: true,
      allow: ['.'],
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-router')) return 'router';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (/[/\\](react|react-dom|scheduler)[/\\]/.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.tsx'],
    css: true,
    include: [
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: ['build/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/**', 'src/setupTests.ts', '**/*.d.ts', 'build/**'],
    },
  },
  resolve: {
    alias: {
      '@': sourceDirectory,
    },
  },
});
