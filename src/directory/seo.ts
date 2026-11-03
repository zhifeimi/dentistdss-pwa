import { breadcrumbJsonLd, type BreadcrumbItem, type JsonLd } from '../seo/jsonld.ts';
import type { PageSeo } from '../seo/pages.ts';
import { absoluteUrl } from '../seo/site.ts';
import { DIRECTORY_PATH, stateName } from './paths.ts';

/** Directory hub pages share one card (src/seo/ogCards.ts, key "dentists"). */
const HUB_CARD = { ogImage: '/og/dentists.png', ogImageAlt: 'Find a dentist by state and suburb' };
import type { PublicClinic } from './types.ts';

const BRAND = ' | DentistDSS';
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The first candidate that fits in a search result title, else the shortest. */
export function fitTitle(candidates: string[]): string {
  return candidates.find((title) => title.length <= TITLE_LIMIT) ??
    [...candidates].sort((a, b) => a.length - b.length)[0];
}

/** Joins sentences, dropping trailing optional ones until the text fits. */
export function fitDescription(required: string, ...optional: string[]): string {
  const parts = [required, ...optional];
  while (parts.length > 1 && parts.join(' ').length > DESCRIPTION_LIMIT) parts.pop();
  return parts.join(' ');
}

const listOf = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

export const openDays = (clinic: PublicClinic) =>
  clinic.operatingHours.filter((day) => day.isOpen && day.openTime && day.closeTime);

export const directoryCrumb: BreadcrumbItem = { name: 'Dentists', path: DIRECTORY_PATH };
const home: BreadcrumbItem = { name: 'Home', path: '/' };

export function clinicTitle(clinic: PublicClinic): string {
  const where = `${clinic.address.suburb} ${clinic.address.state}`;
  return fitTitle([
    ...(clinic.acceptsOnlineBooking ? [`${clinic.name} – Dentist in ${where} | Book Online`] : []),
    `${clinic.name} – Dentist in ${where}${BRAND}`,
    `${clinic.name} – Dentist in ${where}`,
    `${clinic.name} – ${where}`,
    clinic.name,
  ]);
}

export function clinicDescription(clinic: PublicClinic): string {
  const where = `${clinic.address.suburb} ${clinic.address.state}`;
  const services = clinic.services.slice(0, 3).map((service) => service.toLowerCase());
  const days = openDays(clinic).length;
  return fitDescription(
    `${clinic.name} is a dental clinic in ${where}${services.length ? ` offering ${listOf(services)}` : ''}.`,
    ...(days ? [`Open ${days} day${days === 1 ? '' : 's'} a week.`] : []),
    clinic.acceptsOnlineBooking
      ? 'See opening hours and book online with DentistDSS.'
      : 'See the address, opening hours and phone number.',
  );
}

/** schema.org Dentist (a LocalBusiness) built only from fields the clinic provided. */
export function dentistJsonLd(clinic: PublicClinic, path: string): JsonLd {
  const url = absoluteUrl(path);
  const hours = openDays(clinic).map((day) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: `https://schema.org/${DAY_NAMES[day.dayOfWeek]}`,
    opens: day.openTime,
    closes: day.closeTime,
  }));
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': `${url}#clinic`,
    name: clinic.name,
    url,
    address: {
      '@type': 'PostalAddress',
      ...(clinic.address.street ? { streetAddress: clinic.address.street } : {}),
      addressLocality: clinic.address.suburb,
      addressRegion: clinic.address.state,
      ...(clinic.address.postcode ? { postalCode: clinic.address.postcode } : {}),
      addressCountry: 'AU',
    },
  };
  if (clinic.description) node.description = clinic.description;
  if (clinic.phone) node.telephone = clinic.phone;
  if (clinic.location) {
    node.geo = { '@type': 'GeoCoordinates', latitude: clinic.location.latitude, longitude: clinic.location.longitude };
  }
  if (hours.length) node.openingHoursSpecification = hours;
  if (clinic.website) node.sameAs = [clinic.website];
  if (clinic.acceptsOnlineBooking) {
    node.potentialAction = {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl(`/appointments?book=${encodeURIComponent(clinic.slug)}`),
        actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
      },
      result: { '@type': 'Reservation', name: 'Dental appointment' },
    };
  }
  return node;
}

export function clinicSeo(
  clinic: PublicClinic,
  paths: { path: string; suburbPath: string; statePath: string },
  index: boolean,
): PageSeo {
  const { path, suburbPath, statePath } = paths;
  return {
    path,
    title: clinicTitle(clinic),
    description: clinicDescription(clinic),
    index,
    lastModified: clinic.updatedAt ?? undefined,
    jsonLd: [
      dentistJsonLd(clinic, path),
      breadcrumbJsonLd([
        home,
        directoryCrumb,
        { name: stateName(clinic.address.state), path: statePath },
        { name: clinic.address.suburb, path: suburbPath },
        { name: clinic.name, path },
      ]),
    ],
  };
}

export function suburbSeo(
  args: { state: string; suburb: string; path: string; statePath: string; clinicCount: number; postcodes: string[] },
  index: boolean,
  lastModified?: string,
): PageSeo {
  const { state, suburb, path, statePath, clinicCount, postcodes } = args;
  const clinics = `${clinicCount} dental clinic${clinicCount === 1 ? '' : 's'}`;
  return {
    path,
    title: fitTitle([
      `Dentists in ${suburb}, ${state} – Book Online${BRAND}`,
      `Dentists in ${suburb}, ${state}${BRAND}`,
      `Dentists in ${suburb}, ${state}`,
    ]),
    description: fitDescription(
      `Compare ${clinics} in ${suburb}, ${state}${postcodes.length === 1 ? ` ${postcodes[0]}` : ''}.`,
      'See addresses, opening hours and services, and book online with DentistDSS.',
    ),
    index,
    ...HUB_CARD,
    lastModified,
    jsonLd: [breadcrumbJsonLd([home, directoryCrumb, { name: stateName(state), path: statePath }, { name: suburb, path }])],
  };
}

export function stateSeo(
  args: { state: string; path: string; clinicCount: number; suburbCount: number },
  index: boolean,
  lastModified?: string,
): PageSeo {
  const { state, path, clinicCount, suburbCount } = args;
  const name = stateName(state);
  return {
    path,
    title: fitTitle([`Find a Dentist in ${name}${BRAND}`, `Dentists in ${name}${BRAND}`, `Dentists in ${name}`]),
    description: fitDescription(
      `Find a dentist in ${name}. Browse ${clinicCount} dental clinic${clinicCount === 1 ? '' : 's'} across ${suburbCount} suburb${suburbCount === 1 ? '' : 's'}.`,
      'See opening hours and services, and book online.',
    ),
    index,
    ...HUB_CARD,
    lastModified,
    jsonLd: [breadcrumbJsonLd([home, directoryCrumb, { name, path }])],
  };
}

export function countrySeo(index: boolean, lastModified?: string): PageSeo {
  return {
    path: DIRECTORY_PATH,
    title: 'Find a Dentist by State and Suburb | DentistDSS',
    description:
      'Browse dental clinics across Australia by state and suburb. See addresses, opening hours and services, and book an appointment online.',
    index,
    ...HUB_CARD,
    lastModified,
    jsonLd: [breadcrumbJsonLd([home, directoryCrumb])],
  };
}
