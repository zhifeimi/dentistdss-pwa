import { type JsonLd, serializeJsonLd } from './jsonld.ts';
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from './site.ts';

export interface SeoProps {
  title: string;
  description: string;
  /** Canonical path. Ignored when the page is not indexable. */
  path: string;
  index: boolean;
  ogType?: 'website' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  jsonLd?: JsonLd[];
}

export type SeoTag =
  | { tag: 'title'; text: string }
  | { tag: 'meta'; attrs: Record<string, string> }
  | { tag: 'link'; attrs: Record<string, string> }
  | { tag: 'script'; attrs: Record<string, string>; text: string };

/**
 * Head tags for one page. Shared by <Seo> in the browser and by the build-time
 * prerender, so both always emit the same metadata.
 */
export function buildSeoTags(props: SeoProps, siteUrl: string = SITE_URL): SeoTag[] {
  const url = absoluteUrl(props.path, siteUrl);
  const image = absoluteUrl(props.ogImage ?? DEFAULT_OG_IMAGE, siteUrl);
  const imageAlt = props.ogImage ? props.ogImageAlt ?? props.title : DEFAULT_OG_IMAGE_ALT;

  const tags: SeoTag[] = [
    { tag: 'title', text: props.title },
    { tag: 'meta', attrs: { name: 'description', content: props.description } },
  ];

  if (props.index) {
    tags.push({ tag: 'link', attrs: { rel: 'canonical', href: url } });
  } else {
    tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, follow' } });
  }

  tags.push(
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
    { tag: 'meta', attrs: { property: 'og:locale', content: SITE_LOCALE } },
    { tag: 'meta', attrs: { property: 'og:type', content: props.ogType ?? 'website' } },
    { tag: 'meta', attrs: { property: 'og:title', content: props.title } },
    { tag: 'meta', attrs: { property: 'og:description', content: props.description } },
    { tag: 'meta', attrs: { property: 'og:image', content: image } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: imageAlt } },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tag: 'meta', attrs: { name: 'twitter:title', content: props.title } },
    { tag: 'meta', attrs: { name: 'twitter:description', content: props.description } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
  );
  if (props.index) tags.push({ tag: 'meta', attrs: { property: 'og:url', content: url } });

  for (const node of props.jsonLd ?? []) {
    tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, text: serializeJsonLd(node) });
  }
  return tags;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderAttrs = (attrs: Record<string, string>) =>
  Object.entries(attrs).map(([key, value]) => ` ${key}="${escapeHtml(value)}"`).join('');

/**
 * Static HTML for the tags. Each carries `data-seo` so the client can drop the
 * static copies before React renders its own (see src/index.tsx).
 */
export function renderSeoTagsToHtml(tags: SeoTag[]): string {
  return tags.map((tag) => {
    switch (tag.tag) {
      case 'title':
        return `<title data-seo>${escapeHtml(tag.text)}</title>`;
      case 'meta':
        return `<meta data-seo${renderAttrs(tag.attrs)} />`;
      case 'link':
        return `<link data-seo${renderAttrs(tag.attrs)} />`;
      case 'script':
        // JSON-LD is pre-escaped by serializeJsonLd; HTML-escaping it would corrupt it.
        return `<script data-seo${renderAttrs(tag.attrs)}>${tag.text}</script>`;
    }
  }).join('\n    ');
}
