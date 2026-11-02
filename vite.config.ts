import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { shellSeoHtml } from './src/seo/build.ts';
import { PUBLIC_PAGES } from './src/seo/pages.ts';
import { prerenderSite } from './src/seo/prerender.ts';
import { normalizeSiteUrl } from './src/seo/site.ts';

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

/** Default SEO tags (title, description, social card) for the SPA shell. */
function seoShellPlugin(siteUrl: string): Plugin {
  return {
    name: 'dentistdss-seo-shell',
    transformIndexHtml: (html) => html.replace('<!--SEO_TAGS-->', shellSeoHtml(siteUrl)),
  };
}

/**
 * `vite preview` falls back to index.html for /learn instead of serving the
 * prerendered build/learn/index.html. Serve it, as vercel.json does, so local
 * checks see the same HTML as production.
 */
function previewPrerenderedPagesPlugin(): Plugin {
  return {
    name: 'dentistdss-preview-prerendered-pages',
    configurePreviewServer(server) {
      const outDir = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, _res, next) => {
        const [pathname, query = ''] = (req.url ?? '/').split('?');
        const page = `${pathname.replace(/\/+$/, '')}/index.html`;
        if (
          pathname !== '/' && !pathname.includes('.') && existsSync(resolve(outDir, `.${page}`))
        ) {
          req.url = query ? `${page}?${query}` : page;
        }
        next();
      });
    },
  };
}

// Throwaway output of the "ssr" build; read by the prerender, then deleted.
const SSR_OUT_DIR = '.ssr';

export default defineConfig(({ mode }) => {
  const siteUrl = normalizeSiteUrl(loadEnv(mode, process.cwd(), '').VITE_SITE_URL);

  return {
    plugins: [
      react(),
      apiPreconnectPlugin(mode),
      seoShellPlugin(siteUrl),
      previewPrerenderedPagesPlugin(),
    ],
    // `vite build` builds the browser bundle, then a server build of
    // src/entry-server.tsx, then prerenders every public page into build/ (see
    // src/seo/prerender.ts). One Vite run, because scripts/deno-tool.ts copies
    // back only build/ and replaces it on every run.
    builder: {
      async buildApp(builder) {
        const { client, ssr } = builder.environments;
        const root = builder.config.root;
        const ssrOutDir = resolve(root, ssr.config.build.outDir);
        await builder.build(client);
        await builder.build(ssr);
        try {
          const pages = await prerenderSite({
            outDir: resolve(root, client.config.build.outDir),
            ssrEntry: resolve(ssrOutDir, 'entry-server.js'),
            siteUrl,
            pages: PUBLIC_PAGES,
          });
          builder.config.logger.info(`Prerendered ${pages.length} pages, 404.html and sitemap.xml`);
        } finally {
          await rm(ssrOutDir, { recursive: true, force: true });
        }
      },
    },
    environments: {
      ssr: {
        build: {
          ssr: 'src/entry-server.tsx',
          outDir: SSR_OUT_DIR,
          emptyOutDir: true,
          copyPublicDir: false,
        },
      },
    },
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
  };
});
