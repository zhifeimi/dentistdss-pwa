/**
 * Build-time static generation (imported by vite.config.ts, never by the app).
 * After the client and SSR builds, it renders every public page to its own
 * HTML file, so crawlers that don't run JavaScript, link previews and AI
 * search tools read the real content and metadata, and the first paint needs
 * no JavaScript.
 *
 * Output (all from build/index.html, the client build's SPA shell):
 * - build/<path>/index.html for every page in the SEO registry ("/" → index.html)
 * - build/app-shell.html: the untouched shell that vercel.json serves for
 *   signed-in app paths and the service worker uses offline
 * - build/404.html: the Not Found page, served by Vercel with HTTP 404
 * - build/sitemap.xml
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { replaceSeoTags } from './build.ts';
import type { PageSeo } from './pages.ts';
import { buildSitemapXml } from './sitemap.ts';
import { buildSeoTags, renderSeoTagsToHtml, type SeoProps } from './tags.ts';

export interface RenderResult {
  html: string;
  styles: string;
  seo: SeoProps | null;
}
export type Render = (url: string) => Promise<RenderResult>;

/** Any path the router doesn't know renders the Not Found page. */
const NOT_FOUND_PROBE = '/__dentistdss-not-found__';

const ROOT_ELEMENT = '<div id="root"></div>';

/** One prerendered document: shell + page tags + critical CSS + markup. */
export function buildPageHtml(shell: string, result: RenderResult, seo: SeoProps, siteUrl: string): string {
  if (!shell.includes(ROOT_ELEMENT)) throw new Error(`index.html has no ${ROOT_ELEMENT}`);
  const withTags = replaceSeoTags(shell, renderSeoTagsToHtml(buildSeoTags(seo, siteUrl)));
  return withTags
    .replace('</head>', `  ${result.styles}\n  </head>`)
    // The content is in the HTML now, so the "enable JavaScript" notice is wrong.
    .replace(/\s*<noscript>[\s\S]*?<\/noscript>/, '')
    .replace(ROOT_ELEMENT, `<div id="root">${result.html}</div>`);
}

export interface PrerenderedPage {
  path: string;
  index: boolean;
  html: string;
}

const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

/**
 * Problems that would make a page weak or wrong in search, as messages. The
 * build fails on any of them rather than shipping a broken page.
 */
export function findPrerenderProblems(pages: PrerenderedPage[], siteUrl: string): string[] {
  const problems: string[] = [];
  const titles = new Map<string, string>();

  for (const page of pages) {
    const where = `${page.path}:`;
    const title = page.html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
    if (count(page.html, /<title[\s>]/g) !== 1 || !title) problems.push(`${where} needs exactly one non-empty <title>`);
    if (title && titles.has(title)) problems.push(`${where} duplicates the title of ${titles.get(title)}`);
    if (title) titles.set(title, page.path);
    if (count(page.html, /<meta[^>]+name="description"/g) !== 1) problems.push(`${where} needs exactly one meta description`);

    const root = page.html.slice(page.html.indexOf('<div id="root">'));
    if (count(root, /<h1[\s>]/g) !== 1) problems.push(`${where} needs exactly one <h1> in the page content`);

    const canonical = `<link data-seo rel="canonical" href="${siteUrl}${page.path}" />`;
    if (page.index) {
      if (!page.html.includes(canonical)) problems.push(`${where} is missing its canonical link`);
      if (/<meta[^>]+name="robots"[^>]+noindex/.test(page.html)) {
        problems.push(`${where} is indexable but carries noindex`);
      }
    } else if (!page.html.includes('content="noindex, follow"')) {
      problems.push(`${where} should carry noindex`);
    }

    for (const [, json] of page.html.matchAll(/<script data-seo type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(json);
      } catch {
        problems.push(`${where} has invalid JSON-LD`);
      }
    }
  }
  return problems;
}

const fileFor = (outDir: string, path: string) =>
  path === '/' ? resolve(outDir, 'index.html') : resolve(outDir, `.${path}`, 'index.html');

export interface PrerenderOptions {
  outDir: string;
  /** Built SSR entry (src/entry-server.tsx output). */
  ssrEntry: string;
  siteUrl: string;
  pages: readonly PageSeo[];
}

export async function prerenderSite(options: PrerenderOptions): Promise<PrerenderedPage[]> {
  const { outDir, ssrEntry, siteUrl, pages } = options;
  const shell = await readFile(resolve(outDir, 'index.html'), 'utf8');
  const { render } = await import(pathToFileURL(ssrEntry).href) as { render: Render };

  const rendered: PrerenderedPage[] = [];
  for (const page of pages) {
    const result = await render(page.path);
    const seo = result.seo ?? page;
    if (seo.path !== page.path) throw new Error(`${page.path} rendered metadata for ${seo.path}`);
    rendered.push({ path: page.path, index: page.index, html: buildPageHtml(shell, result, seo, siteUrl) });
  }

  const notFound = await render(NOT_FOUND_PROBE);
  if (!notFound.seo || notFound.seo.index) throw new Error('The Not Found page must render noindex metadata');
  const notFoundHtml = buildPageHtml(shell, notFound, notFound.seo, siteUrl);

  const problems = findPrerenderProblems(
    [...rendered, { path: '/404', index: false, html: notFoundHtml }],
    siteUrl,
  );
  if (problems.length) throw new Error(`Prerendered pages failed SEO checks:\n- ${problems.join('\n- ')}`);

  await writeFile(resolve(outDir, 'app-shell.html'), shell);
  await writeFile(resolve(outDir, '404.html'), notFoundHtml);
  await writeFile(resolve(outDir, 'sitemap.xml'), buildSitemapXml(pages, siteUrl));
  for (const page of rendered) {
    const file = fileFor(outDir, page.path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, page.html);
  }
  return rendered;
}
