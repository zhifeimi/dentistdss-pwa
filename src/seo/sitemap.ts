import type { PageSeo } from './pages.ts';
import { absoluteUrl } from './site.ts';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * sitemap.xml for the indexable pages. <lastmod> is only written when a page
 * records a real content change: search engines ignore sitemaps whose dates
 * always say "today".
 */
export function buildSitemapXml(pages: readonly PageSeo[], siteUrl: string): string {
  const urls = pages
    .filter((page) => page.index)
    .map((page) => {
      const loc = `<loc>${escapeXml(absoluteUrl(page.path, siteUrl))}</loc>`;
      const lastmod = page.lastModified ? `<lastmod>${escapeXml(page.lastModified)}</lastmod>` : '';
      return `  <url>${loc}${lastmod}</url>`;
    });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
