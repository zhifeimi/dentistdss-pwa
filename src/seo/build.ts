/**
 * Build-time SEO helpers, imported by vite.config.ts (not by the app bundle).
 */
import { findPage } from './pages.ts';
import { buildSeoTags, renderSeoTagsToHtml, type SeoTag } from './tags.ts';

const isPageSpecific = (tag: SeoTag) =>
  tag.tag === 'script' ||
  (tag.tag === 'link' && tag.attrs.rel === 'canonical') ||
  (tag.tag === 'meta' && tag.attrs.property === 'og:url');

/**
 * Default head tags for the SPA shell (index.html): the home page's title,
 * description and social card, minus anything that names a specific URL. A
 * canonical here would point every shell-served path at "/".
 */
export function shellSeoHtml(siteUrl: string): string {
  const home = findPage('/');
  if (!home) throw new Error('SEO registry has no entry for "/"');
  return renderSeoTagsToHtml(buildSeoTags(home, siteUrl).filter((tag) => !isPageSpecific(tag)));
}

/** Swaps the shell's default SEO tags (data-seo) for another set. */
export function replaceSeoTags(html: string, seoHtml: string): string {
  const withoutDefaults = html
    .replace(/<title data-seo>[\s\S]*?<\/title>\s*/g, '')
    .replace(/<(meta|link) data-seo[^>]*>\s*/g, '')
    .replace(/<script data-seo[^>]*>[\s\S]*?<\/script>\s*/g, '');
  if (!withoutDefaults.includes('</head>')) throw new Error('index.html has no </head>');
  return withoutDefaults.replace('</head>', `  ${seoHtml}\n  </head>`);
}
