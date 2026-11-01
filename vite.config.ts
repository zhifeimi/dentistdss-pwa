import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { notFoundSeoHtml, replaceSeoTags, shellSeoHtml } from './src/seo/build.ts';
import { STATIC_PAGES } from './src/seo/pages.ts';
import { normalizeSiteUrl } from './src/seo/site.ts';
import { buildSitemapXml } from './src/seo/sitemap.ts';

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

/**
 * SEO output: default head tags in index.html, plus build/404.html (the page
 * Vercel serves, with HTTP 404, for unknown paths) and build/sitemap.xml, all
 * generated from the registry in src/seo.
 */
function seoPlugin(mode: string): Plugin {
  const siteUrl = normalizeSiteUrl(loadEnv(mode, process.cwd(), '').VITE_SITE_URL);
  let outDir = '';
  return {
    name: 'dentistdss-seo',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: (html) => html.replace('<!--SEO_TAGS-->', shellSeoHtml(siteUrl)),
    async closeBundle() {
      if (this.environment && this.environment.name !== 'client') return;
      const indexHtml = await readFile(resolve(outDir, 'index.html'), 'utf8');
      await writeFile(
        resolve(outDir, '404.html'),
        replaceSeoTags(indexHtml, notFoundSeoHtml(siteUrl)),
      );
      await writeFile(resolve(outDir, 'sitemap.xml'), buildSitemapXml(STATIC_PAGES, siteUrl));
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), apiPreconnectPlugin(mode), seoPlugin(mode)],
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
