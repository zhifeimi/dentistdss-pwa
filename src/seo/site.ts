/**
 * Site-wide SEO constants. This module is also imported by vite.config.ts at
 * build time (sitemap generation), where `import.meta.env` does not exist, so
 * every env read is guarded and the build passes the origin in explicitly.
 */

const env: Partial<Record<string, string>> =
  (import.meta as { env?: Partial<Record<string, string>> }).env ?? {};

export const DEFAULT_SITE_URL = 'https://dentist.zhifei.org';

/** Normalises an origin: trims whitespace and trailing slashes. */
export function normalizeSiteUrl(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/\/+$/, '');
  return /^https?:\/\/[^/\s]+$/.test(trimmed) ? trimmed : DEFAULT_SITE_URL;
}

/** The one canonical origin. Every other host 301-redirects here. */
export const SITE_URL = normalizeSiteUrl(env.VITE_SITE_URL);

export const SITE_NAME = 'DentistDSS';
export const SITE_LOCALE = 'en_AU';
export const SITE_LANGUAGE = 'en-AU';
export const CONTACT_EMAIL = 'dentistdss@gmail.com';
export const DEFAULT_OG_IMAGE = '/og/default.png';
export const DEFAULT_OG_IMAGE_ALT = 'DentistDSS: find a dentist and book online';

/** Absolute URL on the canonical origin for a site path (or an absolute URL as-is). */
export function absoluteUrl(path: string, siteUrl: string = SITE_URL): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Path without query, hash or trailing slash ("/" stays "/"). */
export function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] || '/';
  return path.length > 1 ? path.replace(/\/+$/, '') || '/' : '/';
}
