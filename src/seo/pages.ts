import { breadcrumbJsonLd, type JsonLd, organizationJsonLd, websiteJsonLd } from './jsonld.ts';
import { normalizePath } from './site.ts';

/**
 * SEO metadata for one public URL. This registry is the single source of truth
 * for titles, descriptions, canonical URLs, robots rules, structured data and
 * the sitemap. Every public route in src/routes/index.tsx needs an entry here
 * (tests/unit/seo.test.ts enforces it).
 *
 * Copy rules: en-AU wording, titles ~30–60 characters with the brand last,
 * descriptions ~70–160 characters, every title and description unique.
 */
export interface PageSeo {
  path: string;
  title: string;
  description: string;
  /** false → `noindex, follow`, no canonical, left out of the sitemap. */
  index: boolean;
  ogType?: 'website' | 'article';
  /** Site path or absolute URL of a 1200×630 image. Defaults to the site card. */
  ogImage?: string;
  ogImageAlt?: string;
  jsonLd?: JsonLd[];
  /** ISO date of the last real content change; feeds sitemap <lastmod>. */
  lastModified?: string;
}

const home = { name: 'Home', path: '/' };

export const STATIC_PAGES: readonly PageSeo[] = [
  {
    path: '/',
    title: 'Find a Dentist & Book Online in Australia | DentistDSS',
    description:
      'Search dental clinics by suburb, name or treatment, see open times and book online without the phone queue. Not sure you need a visit? Ask Dentabot.',
    index: true,
    jsonLd: [organizationJsonLd(), websiteJsonLd()],
  },
  {
    path: '/find-a-clinic',
    title: 'Dentists Near You – Compare & Book Online | DentistDSS',
    description:
      'Find a dentist near you. Search clinics by suburb, name or treatment, compare them on a map and book a dental appointment online.',
    index: true,
    jsonLd: [breadcrumbJsonLd([home, { name: 'Find a clinic', path: '/find-a-clinic' }])],
  },
  {
    path: '/learn',
    title: 'Dental Health Guides & Oral Care Tips | DentistDSS',
    description:
      'Plain-language guides to gum disease, cavities, wisdom teeth, sensitive teeth, bad breath, implants and oral cancer, and when to see a dentist.',
    index: true,
    jsonLd: [breadcrumbJsonLd([home, { name: 'Learn', path: '/learn' }])],
  },
  {
    path: '/quiz',
    title: 'Oral Health Quiz: Check Your Dental Habits | DentistDSS',
    description:
      'Answer 20 quick questions about brushing, flossing, diet and check-ups to see how your daily habits measure up, with tips to improve your oral health.',
    index: true,
    jsonLd: [breadcrumbJsonLd([home, { name: 'Oral health quiz', path: '/quiz' }])],
  },
  {
    path: '/book',
    title: 'Dental Reading List: Recommended Books | DentistDSS',
    description:
      'Recommended dental books for students, hygienists and curious patients, from clinical dentistry handbooks to head and neck anatomy atlases.',
    index: true,
    jsonLd: [breadcrumbJsonLd([home, { name: 'Reading list', path: '/book' }])],
  },
  {
    path: '/privacy',
    title: 'Privacy Policy: How We Handle Your Data | DentistDSS',
    description:
      'How DentistDSS collects, uses, stores and protects personal and health information for patients, dentists and dental clinic staff.',
    index: true,
  },
  {
    path: '/terms',
    title: 'Terms & Conditions of Use | DentistDSS',
    description:
      'The terms that apply when you use DentistDSS to find a dental clinic, book appointments, chat with Dentabot or manage a dental practice.',
    index: true,
  },
  // Account and onboarding screens: useful to people, not to searchers.
  {
    path: '/login',
    title: 'Log In to Your Account | DentistDSS',
    description: 'Log in to DentistDSS to manage your dental appointments, records and clinic schedule.',
    index: false,
  },
  {
    path: '/signup',
    title: 'Create Your Patient Account | DentistDSS',
    description: 'Create a DentistDSS patient account to book dental visits, ask Dentabot and keep your records in one place.',
    index: false,
  },
  {
    path: '/signup/clinic-staff',
    title: "Join Your Clinic's Team | DentistDSS",
    description: 'Dentists and receptionists: create a staff account and ask your clinic admin to approve it.',
    index: false,
  },
  {
    path: '/signup/clinic-admin',
    title: 'Register Your Dental Clinic | DentistDSS',
    description: 'Register your dental clinic on DentistDSS to take online bookings and manage your front desk.',
    index: false,
  },
  {
    path: '/verify-email-code',
    title: 'Enter Your Verification Code | DentistDSS',
    description: 'Enter the code we emailed you to verify your DentistDSS account and finish signing up.',
    index: false,
  },
  {
    path: '/signup/verify',
    title: 'Confirm Your Email Address | DentistDSS',
    description: 'Confirming your email address so you can start using your DentistDSS account.',
    index: false,
  },
  {
    path: '/pending-approval',
    title: 'Account Waiting for Approval | DentistDSS',
    description: 'Your DentistDSS staff account is waiting for your clinic admin to approve it.',
    index: false,
  },
];

export const NOT_FOUND_PAGE: PageSeo = {
  path: '/404',
  title: 'Page Not Found | DentistDSS',
  description: 'This page does not exist. Find a dental clinic, read our oral health guides or go back home.',
  index: false,
};

const pagesByPath = new Map(STATIC_PAGES.map((page) => [page.path, page]));

/** Registry entry for a static public path, ignoring query, hash and trailing slash. */
export function findStaticPage(pathname: string): PageSeo | undefined {
  return pagesByPath.get(normalizePath(pathname));
}

/** Pages that belong in the sitemap. */
export function indexablePages(pages: readonly PageSeo[] = STATIC_PAGES): PageSeo[] {
  return pages.filter((page) => page.index);
}
