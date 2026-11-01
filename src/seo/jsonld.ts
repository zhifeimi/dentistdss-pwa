import { absoluteUrl, CONTACT_EMAIL, SITE_LANGUAGE, SITE_NAME, SITE_URL } from './site.ts';

/** A schema.org JSON-LD node. Kept loose: schema.org is open-ended. */
export type JsonLd = { [key: string]: unknown };

export interface BreadcrumbItem {
  name: string;
  path: string;
}

const organizationId = () => `${SITE_URL}/#organization`;
const websiteId = () => `${SITE_URL}/#website`;

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(),
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logo512.png'),
      width: 512,
      height: 512,
    },
    email: CONTACT_EMAIL,
    areaServed: { '@type': 'Country', name: 'Australia' },
  };
}

/** WebSite node: its `name` is what Google shows as the site name in results. */
export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(),
    name: SITE_NAME,
    alternateName: ['Dentist DSS'],
    url: absoluteUrl('/'),
    inLanguage: SITE_LANGUAGE,
    publisher: { '@id': organizationId() },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Serialises JSON-LD for an inline <script>. Escapes "<" so content can never
 * close the script element early.
 */
export function serializeJsonLd(node: JsonLd): string {
  return JSON.stringify(node).replace(/</g, '\\u003c');
}
