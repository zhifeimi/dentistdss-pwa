/**
 * Social share cards (1200×630 PNG, public/og/<key>.png) for the main pages.
 * The images are generated from this list by tests/og/og-cards.spec.ts
 * (`deno task og-images`) and committed: Vercel builds can't run a browser.
 * Pages without a card use public/og/default.png; articles use their photo.
 */
import { CLINIC_FEATURES, featurePath, FOR_CLINICS_PATH } from '../content/forClinics.ts';

export interface OgCard {
  /** File name under public/og (without .png). */
  key: string;
  /** Pages that use the card. */
  paths: string[];
  heading: string;
  text: string;
}

export const OG_CARDS: readonly OgCard[] = [
  {
    key: 'find-a-clinic',
    paths: ['/find-a-clinic'],
    heading: 'Dentists near you',
    text: 'Compare clinics by suburb, name or treatment and book online.',
  },
  {
    key: 'dentists',
    paths: ['/dentists'],
    heading: 'Find a dentist by state and suburb',
    text: 'Opening hours, services and online booking for clinics across Australia.',
  },
  {
    key: 'learn',
    paths: ['/learn'],
    heading: 'Dental health guides',
    text: 'Plain-language guides to gum disease, cavities, wisdom teeth and more.',
  },
  {
    key: 'quiz',
    paths: ['/quiz'],
    heading: 'Oral health quiz',
    text: '20 quick questions about your daily habits, with tips to improve them.',
  },
  {
    key: 'for-clinics',
    paths: [FOR_CLINICS_PATH],
    heading: 'Dental practice software',
    text: 'Online booking, patient records and an AI receptionist on one screen.',
  },
  ...CLINIC_FEATURES.map((feature) => ({
    key: `for-clinics-${feature.slug}`,
    paths: [featurePath(feature)],
    heading: feature.heading,
    text: feature.summary,
  })),
];

export const ogCardPath = (card: Pick<OgCard, 'key'>) => `/og/${card.key}.png`;

const byPath = new Map(OG_CARDS.flatMap((card) => card.paths.map((path) => [path, card] as const)));

/** The card for a page path, if it has one. */
export const findOgCard = (path: string) => byPath.get(path);
