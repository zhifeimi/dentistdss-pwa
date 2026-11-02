/**
 * Vercel Web Analytics (page views, conversion events) and Speed Insights
 * (Core Web Vitals from real visitors). Cookieless and aggregated; disclosed
 * in the privacy policy. Both scripts are served by Vercel from the same
 * origin (/_vercel/...) once switched on for the project.
 */
import { inject, track } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Drops the query string and fragment: they can carry search terms, booking
 * links or one-time tokens (/signup/verify?token=...), none of which belong
 * in analytics.
 */
export function stripQuery(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

const withoutQuery = <T extends { url: string }>(event: T): T => ({ ...event, url: stripQuery(event.url) });

let started = false;

/** Production browsers only: development and the build-time prerender send nothing. */
export function startAnalytics(isProduction = import.meta.env.PROD): void {
  if (started || !isProduction || typeof window === 'undefined') return;
  started = true;
  inject({ mode: 'production', framework: 'react', beforeSend: withoutQuery });
  injectSpeedInsights({ framework: 'react', beforeSend: withoutQuery });
}

/** The conversions the SEO work is measured by. */
export type AnalyticsEvent =
  | 'Clinic search'
  | 'Clinic registration started'
  | 'Clinic registration submitted'
  | 'Booking started'
  | 'Booking requested';

/**
 * Records a conversion. Properties are counts and flags only, never names,
 * emails, search text or anything else that could identify a person.
 * (Custom events need a Vercel Pro plan; on Hobby they are dropped.)
 */
export function trackEvent(name: AnalyticsEvent, properties?: Record<string, number | boolean | null>): void {
  if (!started) return;
  try {
    track(name, properties);
  } catch {
    // Analytics must never break the page.
  }
}
