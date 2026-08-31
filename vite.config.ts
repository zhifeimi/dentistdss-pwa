import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const sourceDirectory = decodeURIComponent(new URL('./src', import.meta.url).pathname);

/**
 * Emits a crossorigin preconnect for the configured API host so the browser can
 * complete DNS/TLS before the auth bootstrap fires. Emits nothing when no usable
 * http(s) host is configured (e.g. same-origin or local dev without a host).
 */
function apiPreconnectPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '');
  const apiHost = (env.VITE_API_HOST || '').replace(/\/$/, '');
  const preconnect = /^https?:\/\//.test(apiHost)
    ? `<link rel="preconnect" href="${apiHost}" crossorigin />`
    : '';
  return {
    name: 'api-preconnect',
    transformIndexHtml: (html) => html.replace('<!--VITE_API_PRECONNECT-->', preconnect),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), apiPreconnectPlugin(mode)],
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
          if (!id.includes('node_modules')) return undefined;
          // MUI date pickers ship only with the pages that import them
          // (Schedule/availability flows) instead of inflating the
          // always-loaded mui vendor chunk.
          if (id.includes('@mui/x-date-pickers')) return 'mui-pickers';
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
}));
