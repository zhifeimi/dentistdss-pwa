/// <reference path="./vite-env.d.ts" />

/**
 * Build-time render entry (never shipped to browsers). vite.config.ts builds it
 * as the "ssr" environment, and src/seo/prerender.ts calls render() once per
 * public URL to write static HTML that crawlers and link previews can read.
 */
// The edge build, not 'react-dom/static': under Deno that specifier resolves to
// the browser build, which opens a MessageChannel on import and keeps the
// build process from exiting. The edge build has the same prerender().
import { prerender } from 'react-dom/static.edge';
import { StaticRouter } from 'react-router';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { AppContent } from './App';
import { AuthProvider } from './context/auth';
import type { DirectoryPage } from './directory/model';
import { DirectoryPageContext } from './directory/useDirectoryPage';
import { type SeoCollector, SeoCollectorContext } from './seo/Seo';
import type { SeoProps } from './seo/tags';

export interface RenderResult {
  /** Markup for #root. */
  html: string;
  /** <style> tags with the Emotion (MUI) rules the page used: globals, then components. */
  styles: string;
  /** Metadata the page's <Seo> asked for, if any. */
  seo: SeoProps | null;
}

const noop = () => undefined;

export interface RenderContext {
  /** Data for a /dentists page (see src/directory). */
  directoryPage?: DirectoryPage | null;
}

export async function render(url: string, context: RenderContext = {}): Promise<RenderResult> {
  // Compat mode collects rules in cache.inserted instead of rendering inline
  // <style> tags next to each component.
  const cache = createCache({ key: 'css' });
  cache.compat = true;
  const collector: SeoCollector = { current: null };

  // Signed-out, light-mode render: that is what a first-time visitor sees.
  const { prelude } = await prerender(
    <CacheProvider value={cache}>
      <SeoCollectorContext.Provider value={collector}>
        <DirectoryPageContext.Provider value={context.directoryPage ?? null}>
          <AuthProvider>
            <StaticRouter location={url}>
              <AppContent darkMode={false} toggleDarkMode={noop} logout={noop} />
            </StaticRouter>
          </AuthProvider>
        </DirectoryPageContext.Provider>
      </SeoCollectorContext.Provider>
    </CacheProvider>,
    // React outlines large sections into a hidden <div> plus an inline script
    // that moves them into place (progressive reveal). Crawlers that don't run
    // JavaScript would read that content as hidden, so keep everything inline.
    { progressiveChunkSize: Number.MAX_SAFE_INTEGER },
  );
  const html = await new Response(prelude).text();
  if (/<template id="B:|<div hidden id="S:/.test(html)) {
    throw new Error(`${url} rendered outlined (hidden) content`);
  }

  // Split rules the way @emotion/server does: component rules (their class
  // name appears in the markup) and global rules (CssBaseline, GlobalStyles).
  // Globals get their own tag so the client's Emotion cache inserts a
  // different theme's globals (dark mode) after them, not before.
  const component = { ids: [] as string[], css: '' };
  const global = { ids: [] as string[], css: '' };
  for (const [id, rules] of Object.entries(cache.inserted)) {
    if (typeof rules !== 'string') continue;
    const bucket = html.includes(`${cache.key}-${id}`) ? component : global;
    bucket.ids.push(id);
    bucket.css += rules;
  }
  // The client cache adopts these tags (data-emotion="<key> <ids>") and skips
  // re-inserting the rules they hold.
  const tag = (key: string, { ids, css }: { ids: string[]; css: string }) =>
    css ? `<style data-emotion="${key} ${ids.join(' ')}">${css}</style>` : '';
  const styles = tag(`${cache.key}-global`, global) + tag(cache.key, component);

  return { html, styles, seo: collector.current };
}
