import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { replaceSeoTags, shellSeoHtml } from '../../src/seo/build';
import { breadcrumbJsonLd, serializeJsonLd } from '../../src/seo/jsonld';
import { ARTICLES } from '../../src/content/articles';
import { CLINIC_FEATURES } from '../../src/content/forClinics';
import {
  ARTICLE_PAGES,
  findPage,
  FOR_CLINICS_PAGES,
  indexablePages,
  NOT_FOUND_PAGE,
  PUBLIC_PAGES,
} from '../../src/seo/pages';
import { DEFAULT_SITE_URL, normalizePath, normalizeSiteUrl, SITE_URL } from '../../src/seo/site';
import { buildSitemapXml } from '../../src/seo/sitemap';
import { buildSeoTags, renderSeoTagsToHtml } from '../../src/seo/tags';
import { OG_CARDS, ogCardPath } from '../../src/seo/ogCards';
import { existsSync } from 'node:fs';
import dictionary, { isAppPath } from '../../src/utils/dictionary';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const pathsIn = (source: string, pattern: RegExp) =>
  [...source.matchAll(pattern)].map((match) => match[1]);

/** Top-level routes declared in src/routes/index.tsx (without :params or wildcards). */
const ROUTE_PATHS = pathsIn(read('src/routes/index.tsx'), /path="([^"]+)"/g)
  .filter((path) => !path.includes('*') && !path.includes(':'));

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
// Our sources use literal paths, plain regex groups and single-segment
// :params; this reads them the way path-to-regexp does.
const sourcePattern = (source: string) =>
  new RegExp(`^${source.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`);
const matches = (source: string, path: string) => sourcePattern(source).test(path);
const isRewritten = (path: string) => vercel.rewrites.some(({ source }) => matches(source, path));
/** Where vercel.json sends a path, with :params filled in. */
const rewriteFor = (path: string) => {
  const rule = vercel.rewrites.find(({ source }) => matches(source, path));
  const params = rule && sourcePattern(rule.source).exec(path)?.groups;
  return rule?.destination.replace(/:(\w+)/g, (_, name: string) => params?.[name] ?? '');
};

describe('SEO registry', () => {
  it('has an entry for every public route', () => {
    expect(ROUTE_PATHS.length).toBeGreaterThan(10);
    for (const path of ROUTE_PATHS) {
      expect(findPage(path), `missing SEO entry for ${path}`).toBeDefined();
    }
  });

  it('keeps titles and descriptions unique and within search snippet lengths', () => {
    const pages = [...PUBLIC_PAGES, NOT_FOUND_PAGE];
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
      expect(findPage(path)?.index, path).toBe(true);
    }
    for (const path of ['/login', '/signup', '/signup/clinic-admin', '/signup/verify', '/pending-approval']) {
      expect(findPage(path)?.index, path).toBe(false);
    }
    expect(NOT_FOUND_PAGE.index).toBe(false);
  });

  it('looks pages up without query strings or trailing slashes', () => {
    expect(normalizePath('/find-a-clinic/?q=parramatta#map')).toBe('/find-a-clinic');
    expect(findPage('/find-a-clinic?q=parramatta')?.path).toBe('/find-a-clinic');
    expect(findPage('/')?.path).toBe('/');
    expect(findPage('/no-such-page')).toBeUndefined();
  });
});

describe('content pages', () => {
  it('gives every article and clinic feature a page', () => {
    expect(ARTICLE_PAGES.map(({ path }) => path)).toEqual(ARTICLES.map(({ slug }) => `/learn/${slug}`));
    expect(FOR_CLINICS_PAGES.map(({ path }) => path)).toEqual([
      '/for-clinics',
      ...CLINIC_FEATURES.map(({ slug }) => `/for-clinics/${slug}`),
    ]);
    for (const page of [...ARTICLE_PAGES, ...FOR_CLINICS_PAGES]) expect(page.index, page.path).toBe(true);
  });

  it('keeps article bodies next to their metadata and drafts unpublished', () => {
    for (const { slug } of ARTICLES) {
      expect(read(`src/content/articles/${slug}.md`).trim().length, slug).toBeGreaterThan(300);
    }
    const sitemap = buildSitemapXml(PUBLIC_PAGES, DEFAULT_SITE_URL);
    expect(sitemap).not.toContain('/drafts');
    expect(PUBLIC_PAGES.some(({ path }) => path.includes('draft'))).toBe(false);
  });

  it('marks articles up as Article with dates, an image and breadcrumbs', () => {
    const tags = buildSeoTags(findPage('/learn/gum-disease')!);
    const nodes = tags.flatMap((tag) => tag.tag === 'script' ? [JSON.parse(tag.text)] : []);
    const article = nodes.find((node) => node['@type'] === 'Article');
    expect(article).toMatchObject({
      headline: 'Understanding Gum Disease: Early Signs and Prevention',
      datePublished: '2025-06-04',
      dateModified: '2026-11-03',
      image: ['https://dentist.zhifei.org/images/learn/gum-disease.webp'],
      mainEntityOfPage: 'https://dentist.zhifei.org/learn/gum-disease',
    });
    expect(nodes.find((node) => node['@type'] === 'BreadcrumbList').itemListElement).toHaveLength(3);
    expect(tags).toContainEqual({ tag: 'meta', attrs: { property: 'og:type', content: 'article' } });
  });

  it('dates the sitemap entries of articles', () => {
    expect(buildSitemapXml(PUBLIC_PAGES, DEFAULT_SITE_URL)).toContain(
      '<loc>https://dentist.zhifei.org/learn/gum-disease</loc><lastmod>2026-11-03</lastmod>',
    );
  });

  it('lists sources for every published article without claiming a review that has not happened', () => {
    for (const article of ARTICLES) {
      expect(article.references.length, article.slug).toBeGreaterThanOrEqual(2);
      for (const { url, title, publisher } of article.references) {
        expect(url, article.slug).toMatch(/^https:\/\//);
        expect(title && publisher, article.slug).toBeTruthy();
      }
      // Set only after a registered dentist has reviewed the text (docs/seo/article-review.md).
      expect(article.reviewer, article.slug).toBeUndefined();
    }
  });

  it('describes the clinic product as a SoftwareApplication without invented offers', () => {
    const tags = buildSeoTags(findPage('/for-clinics')!);
    const app = tags.flatMap((tag) => tag.tag === 'script' ? [JSON.parse(tag.text)] : [])
      .find((node) => node['@type'] === 'SoftwareApplication');
    expect(app).toMatchObject({ name: 'DentistDSS', applicationCategory: 'BusinessApplication' });
    expect(app).not.toHaveProperty('offers');
    expect(app).not.toHaveProperty('aggregateRating');
  });
});

describe('share cards', () => {
  it('has an image file for every card and every page that names one', () => {
    for (const card of OG_CARDS) {
      expect(existsSync(resolve(process.cwd(), `public${ogCardPath(card)}`)), card.key).toBe(true);
    }
    for (const page of PUBLIC_PAGES) {
      if (!page.ogImage) continue;
      expect(existsSync(resolve(process.cwd(), `public${page.ogImage}`)), page.path).toBe(true);
    }
  });

  it('gives the main pages their own card and keeps article photos', () => {
    expect(findPage('/learn')).toMatchObject({ ogImage: '/og/learn.png', ogImageAlt: 'Dental health guides' });
    expect(findPage('/for-clinics/online-booking')?.ogImage).toBe('/og/for-clinics-online-booking.png');
    expect(findPage('/learn/gum-disease')?.ogImage).toBe('/images/learn/gum-disease.webp');
    expect(findPage('/')?.ogImage).toBeUndefined();
  });
});

describe('SEO tags', () => {
  const tagsFor = (path: string) => buildSeoTags(findPage(path)!);
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
    // The home page uses the default card; pages with their own card are covered below.
    expect(tagsFor('/')).toContainEqual({
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

  it('names Zhifei.org and its official profiles as the organisation behind DentistDSS', () => {
    const organization = tagsFor('/')
      .flatMap((tag) => tag.tag === 'script' ? [JSON.parse(tag.text)] : [])
      .find((node) => node['@type'] === 'Organization');
    expect(organization).toMatchObject({
      name: 'DentistDSS',
      url: 'https://dentist.zhifei.org/',
      parentOrganization: {
        '@type': 'Organization',
        name: 'Zhifei.org',
        url: 'https://zhifei.org',
        sameAs: ['https://zhifeis.tech', 'https://www.linkedin.com/in/zhifeimi/', 'https://github.com/zhifeimi'],
      },
    });
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
    const xml = buildSitemapXml(PUBLIC_PAGES, DEFAULT_SITE_URL);
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
    for (const page of PUBLIC_PAGES.filter(({ path }) => path !== '/')) {
      expect(rewriteFor(page.path), page.path).toBe(`${page.path}/index.html`);
    }
  });

  it('serves clinic directory pages from their prerendered files', () => {
    expect(rewriteFor('/dentists')).toBe('/dentists/index.html');
    expect(rewriteFor('/dentists/nsw')).toBe('/dentists/nsw/index.html');
    expect(rewriteFor('/dentists/nsw/north-sydney')).toBe('/dentists/nsw/north-sydney/index.html');
    expect(rewriteFor('/dentists/nsw/north-sydney/harbourside')).toBe('/dentists/nsw/north-sydney/harbourside/index.html');
    // Deeper paths are never pages, so they fall through to the 404.
    expect(isRewritten('/dentists/nsw/north-sydney/harbourside/extra')).toBe(false);
  });

  it('serves signed-in app paths from the app shell, and nothing else', () => {
    for (const path of dictionary.locations.app) expect(rewriteFor(path), path).toBe('/app-shell.html');
    expect(rewriteFor('/appointments/123')).toBe('/app-shell.html');
    // Unknown paths fall through to build/404.html with an HTTP 404 status.
    for (const path of ['/no-such-page', '/learnx', '/wp-admin', '/sitemap.xml', '/learn/a/b']) {
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
