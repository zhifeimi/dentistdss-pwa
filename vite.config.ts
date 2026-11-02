import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { loadDirectory } from './src/directory/load.ts';
import { buildDirectory } from './src/directory/model.ts';
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

/** Default SEO tags (title, description, social card) and the font preload for the SPA shell. */
function seoShellPlugin(siteUrl: string): Plugin {
  return {
    name: 'dentistdss-seo-shell',
    transformIndexHtml: (html, ctx) => {
      const withTags = html.replace('<!--SEO_TAGS-->', shellSeoHtml(siteUrl));
      // Preload the latin Atkinson face (the one every page uses) so text
      // renders in it without waiting for the CSS to be parsed. Build only:
      // the bundle lists the hashed file name.
      const font = Object.keys(ctx.bundle ?? {})
        .find((file) => /atkinson-hyperlegible-next-latin-wght-normal-[\w-]+\.woff2$/.test(file));
      return font
        ? withTags.replace(
          '</head>',
          `  <link rel="preload" href="/${font}" as="font" type="font/woff2" crossorigin />\n  </head>`,
        )
        : withTags;
    },
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
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL);

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
        const logger = builder.config.logger;
        // The public clinic directory (clinic and suburb pages). With an https
        // VITE_API_HOST a failed fetch fails the build, so Vercel keeps the
        // last good deployment instead of dropping every clinic page.
        const loaded = await loadDirectory({
          apiHost: env.VITE_API_HOST,
          fixturePath: env.PUBLIC_CLINICS_FIXTURE
            ? resolve(root, env.PUBLIC_CLINICS_FIXTURE)
            : undefined,
          log: (message) => logger.warn(message),
        });
        for (const reason of loaded.dropped) {
          logger.warn(`Clinic left out of the directory: ${reason}`);
        }
        logger.info(
          `Clinic directory: ${loaded.directory.clinics.length} clinics (${loaded.source})`,
        );

        await builder.build(client);
        await builder.build(ssr);
        try {
          const pages = await prerenderSite({
            outDir: resolve(root, client.config.build.outDir),
            ssrEntry: resolve(ssrOutDir, 'entry-server.js'),
            siteUrl,
            pages: PUBLIC_PAGES,
            directory: { data: loaded.directory, index: buildDirectory(loaded.directory) },
          });
          logger.info(`Prerendered ${pages.length} pages, 404.html and sitemap.xml`);
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
      exclude: ['build/**', 'tests/e2e/**', 'tests/og/**'],
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
