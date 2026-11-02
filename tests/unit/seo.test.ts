import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { replaceSeoTags, shellSeoHtml } from '../../src/seo/build';
import { breadcrumbJsonLd, serializeJsonLd } from '../../src/seo/jsonld';
import { findStaticPage, indexablePages, NOT_FOUND_PAGE, STATIC_PAGES } from '../../src/seo/pages';
import { DEFAULT_SITE_URL, normalizePath, normalizeSiteUrl, SITE_URL } from '../../src/seo/site';
import { buildSitemapXml } from '../../src/seo/sitemap';
import { buildSeoTags, renderSeoTagsToHtml } from '../../src/seo/tags';
import dictionary, { isAppPath } from '../../src/utils/dictionary';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const pathsIn = (source: string, pattern: RegExp) =>
  [...source.matchAll(pattern)].map((match) => match[1]);

/** Top-level routes declared in src/routes/index.tsx. */
const ROUTE_PATHS = pathsIn(read('src/routes/index.tsx'), /path="([^"]+)"/g)
  .filter((path) => path !== '*' && !path.includes('*'));

/** Signed-in routes: role routes plus DashboardLayout's standalone routes. */
const APP_ROUTE_PATHS = [
  ...pathsIn(read('src/utils/dashboard/roleConfig.tsx'), /path: '([^']+)'/g),
  ...pathsIn(read('src/components/Dashboard/DashboardLayout/index.tsx'), /path='([^']+)'/g),
].filter((path) => path !== '*');

const vercel = JSON.parse(read('vercel.json')) as {
  rewrites: { source: string; destination: string }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
  redirects: { has?: { type: string; value: string }[]; destination: string }[];
};
// Our sources only use literal paths and plain regex groups, which read the
// same as path-to-regexp patterns.
const matches = (source: string, path: string) => new RegExp(`^${source}$`).test(path);
const isRewritten = (path: string) => vercel.rewrites.some(({ source }) => matches(source, path));

describe('SEO registry', () => {
  it('has an entry for every public route', () => {
    expect(ROUTE_PATHS.length).toBeGreaterThan(10);
    for (const path of ROUTE_PATHS) {
      expect(findStaticPage(path), `missing SEO entry for ${path}`).toBeDefined();
    }
  });

  it('keeps titles and descriptions unique and within search snippet lengths', () => {
    const pages = [...STATIC_PAGES, NOT_FOUND_PAGE];
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.description)).size).toBe(pages.length);
    for (const page of pages) {
      expect(page.title.length, page.title).toBeGreaterThanOrEqual(25);
      expect(page.title.length, page.title).toBeLessThanOrEqual(60);
      expect(page.title.endsWith('| DentistDSS'), page.title).toBe(true);
      expect(page.description.length, page.description).toBeGreaterThanOrEqual(70);
      expect(page.description.length, page.description).toBeLessThanOrEqual(160);
    }
  });

  it('indexes content pages and keeps account screens out of search', () => {
    for (const path of ['/', '/find-a-clinic', '/learn', '/quiz', '/book', '/privacy', '/terms']) {
      expect(findStaticPage(path)?.index, path).toBe(true);
    }
    for (const path of ['/login', '/signup', '/signup/clinic-admin', '/signup/verify', '/pending-approval']) {
      expect(findStaticPage(path)?.index, path).toBe(false);
    }
    expect(NOT_FOUND_PAGE.index).toBe(false);
  });

  it('looks pages up without query strings or trailing slashes', () => {
    expect(normalizePath('/find-a-clinic/?q=parramatta#map')).toBe('/find-a-clinic');
    expect(findStaticPage('/find-a-clinic?q=parramatta')?.path).toBe('/find-a-clinic');
    expect(findStaticPage('/')?.path).toBe('/');
    expect(findStaticPage('/no-such-page')).toBeUndefined();
  });
});

describe('SEO tags', () => {
  const tagsFor = (path: string) => buildSeoTags(findStaticPage(path)!);
  const canonicalOf = (path: string) =>
    tagsFor(path).find((tag) => tag.tag === 'link' && tag.attrs.rel === 'canonical');

  it('points indexable pages at one absolute canonical URL, without the query', () => {
    expect(SITE_URL).toBe(DEFAULT_SITE_URL);
    expect(canonicalOf('/')).toEqual({ tag: 'link', attrs: { rel: 'canonical', href: 'https://dentist.zhifei.org/' } });
    expect(canonicalOf('/find-a-clinic')).toEqual({
      tag: 'link',
      attrs: { rel: 'canonical', href: 'https://dentist.zhifei.org/find-a-clinic' },
    });
  });

  it('marks non-indexable pages noindex and gives them no canonical', () => {
    const tags = tagsFor('/login');
    expect(tags).toContainEqual({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, follow' } });
    expect(canonicalOf('/login')).toBeUndefined();
  });

  it('includes social card tags with an absolute image URL', () => {
    expect(tagsFor('/learn')).toContainEqual({
      tag: 'meta',
      attrs: { property: 'og:image', content: 'https://dentist.zhifei.org/og/default.png' },
    });
    expect(tagsFor('/learn')).toContainEqual({
      tag: 'meta',
      attrs: { name: 'twitter:card', content: 'summary_large_image' },
    });
  });

  it('describes the site and organisation on the home page with valid JSON-LD', () => {
    const scripts = tagsFor('/').filter((tag) => tag.tag === 'script');
    const types = scripts.map((tag) => JSON.parse(tag.tag === 'script' ? tag.text : '{}')['@type']);
    expect(types).toEqual(['Organization', 'WebSite']);
  });

  it('escapes "<" so JSON-LD cannot close its script element', () => {
    const json = serializeJsonLd(breadcrumbJsonLd([{ name: '</script><script>alert(1)', path: '/' }]));
    expect(json).not.toContain('<');
    expect(JSON.parse(json).itemListElement[0].name).toBe('</script><script>alert(1)');
  });

  it('normalises the configured site origin and falls back to the canonical domain', () => {
    expect(normalizeSiteUrl(' https://example.com/ ')).toBe('https://example.com');
    expect(normalizeSiteUrl('not a url')).toBe(DEFAULT_SITE_URL);
    expect(normalizeSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
  });
});

describe('build output helpers', () => {
  it('lists only indexable pages in the sitemap', () => {
    const xml = buildSitemapXml(STATIC_PAGES, DEFAULT_SITE_URL);
    const locs = pathsIn(xml, /<loc>([^<]+)<\/loc>/g);
    expect(locs).toEqual(indexablePages().map((page) => `${DEFAULT_SITE_URL}${page.path}`));
    expect(xml).not.toContain('/login');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it('gives the SPA shell default tags without a canonical or JSON-LD', () => {
    const html = shellSeoHtml(DEFAULT_SITE_URL);
    expect(html).toContain('<title data-seo>');
    expect(html).toContain('name="description"');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('og:url');
    expect(html).not.toContain('application/ld+json');
  });

  it('swaps the shell tags for the 404 tags', () => {
    const shell = read('index.html').replace('<!--SEO_TAGS-->', shellSeoHtml(DEFAULT_SITE_URL));
    const notFound = replaceSeoTags(shell, renderSeoTagsToHtml(buildSeoTags(NOT_FOUND_PAGE)));
    expect(notFound.match(/<title/g)).toHaveLength(1);
    expect(notFound).toContain('<title data-seo>Page Not Found | DentistDSS</title>');
    expect(notFound).toContain('content="noindex, follow"');
    expect(notFound.match(/name="description"/g)).toHaveLength(1);
  });

  it('serves the SEO tags from index.html in en-AU', () => {
    const html = read('index.html');
    expect(html).toContain('<html lang="en-AU">');
    expect(html).toContain('<!--SEO_TAGS-->');
    expect(html).not.toMatch(/<title>|name="description"/);
  });
});

describe('crawl rules', () => {
  it('advertises the sitemap on the canonical domain in robots.txt', () => {
    expect(read('public/robots.txt')).toContain(`Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`);
  });

  it('treats every signed-in route as an app path and every public route as public', () => {
    expect(APP_ROUTE_PATHS.length).toBeGreaterThan(10);
    for (const path of APP_ROUTE_PATHS) expect(isAppPath(path), path).toBe(true);
    for (const path of ROUTE_PATHS) expect(isAppPath(path), path).toBe(false);
    expect(isAppPath('/dashboard/anything')).toBe(true);
    expect(isAppPath('/settingsx')).toBe(false);
  });

  it('serves each public page from its prerendered file', () => {
    // Explicit rewrites: they work whether or not the host resolves
    // /learn to learn/index.html by itself.
    for (const page of STATIC_PAGES.filter(({ path }) => path !== '/')) {
      expect(vercel.rewrites, page.path).toContainEqual({
        source: page.path,
        destination: `${page.path}/index.html`,
      });
    }
  });

  it('serves signed-in app paths from the app shell, and nothing else', () => {
    const rewriteFor = (path: string) =>
      vercel.rewrites.find(({ source }) => matches(source, path))?.destination;
    for (const path of dictionary.locations.app) expect(rewriteFor(path), path).toBe('/app-shell.html');
    expect(rewriteFor('/appointments/123')).toBe('/app-shell.html');
    // Unknown paths fall through to build/404.html with an HTTP 404 status.
    for (const path of ['/no-such-page', '/learnx', '/wp-admin', '/sitemap.xml']) {
      expect(isRewritten(path), path).toBe(false);
    }
  });

  it('sends noindex headers for signed-in app paths only', () => {
    const noindexed = (path: string) =>
      vercel.headers.some(({ source, headers }) =>
        matches(source, path) && headers.some(({ key }) => key === 'X-Robots-Tag')
      );
    for (const path of dictionary.locations.app) expect(noindexed(path), path).toBe(true);
    for (const path of ['/', '/learn', '/find-a-clinic']) expect(noindexed(path), path).toBe(false);
  });

  it('redirects the other production hosts to the canonical domain', () => {
    const hosts = vercel.redirects.flatMap(({ has = [] }) => has.map(({ value }) => value));
    expect(hosts).toEqual(['dentist.mizhifei.press', 'dentistdss.vercel.app']);
    for (const redirect of vercel.redirects) {
      expect(redirect.destination.startsWith(`${DEFAULT_SITE_URL}/`)).toBe(true);
    }
  });
});
