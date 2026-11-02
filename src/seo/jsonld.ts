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

export interface ArticleJsonLdInput {
  path: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  reviewer?: { name: string; credentials: string; url?: string };
}

/**
 * Article markup for a Learn guide. The organisation is the author until a
 * named, qualified reviewer exists; then a WebPage node records the review.
 */
export function articleJsonLd(article: ArticleJsonLdInput): JsonLd[] {
  const url = absoluteUrl(article.path);
  const nodes: JsonLd[] = [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: [absoluteUrl(article.image)],
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: SITE_LANGUAGE,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
    publisher: { '@id': organizationId() },
  }];
  if (article.reviewer) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': url,
      url,
      lastReviewed: article.dateModified,
      reviewedBy: {
        '@type': 'Person',
        name: article.reviewer.name,
        description: article.reviewer.credentials,
        ...(article.reviewer.url ? { url: article.reviewer.url } : {}),
      },
    });
  }
  return nodes;
}

/** The product itself, for the clinic-facing landing page. No offers until pricing is public. */
export function softwareApplicationJsonLd(path: string, description: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: absoluteUrl(path),
    description,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Dental practice management',
    operatingSystem: 'Web',
    inLanguage: SITE_LANGUAGE,
    publisher: { '@id': organizationId() },
  };
}
