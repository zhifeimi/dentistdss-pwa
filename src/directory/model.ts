import type { PageSeo } from '../seo/pages.ts';
import { clinicPath, DIRECTORY_PATH, slugify, stateName, statePath, suburbPath } from './paths.ts';
import { clinicSeo, countrySeo, openDays, stateSeo, suburbSeo } from './seo.ts';
import type { PublicClinic, PublicDirectory } from './types.ts';

/** A suburb hub is indexed only with this many clinics, so hubs are never thin doorway pages. */
export const SUBURB_INDEX_MIN_CLINICS = 3;

export interface ClinicSummary {
  slug: string;
  name: string;
  path: string;
  street: string | null;
  postcode: string | null;
  phone: string | null;
  services: string[];
  openDays: number;
  acceptsOnlineBooking: boolean;
}

export interface SuburbSummary {
  name: string;
  path: string;
  clinicCount: number;
  postcodes: string[];
}

export interface StateSummary {
  code: string;
  name: string;
  path: string;
  clinicCount: number;
  suburbCount: number;
}

interface PageBase {
  path: string;
  seo: PageSeo;
}

/**
 * Everything one /dentists page needs, small enough to embed in its
 * prerendered HTML so the browser renders the same page without a request.
 */
export type DirectoryPage =
  | PageBase & { kind: 'country'; states: StateSummary[]; clinicCount: number }
  | PageBase & { kind: 'state'; state: StateSummary; suburbs: SuburbSummary[] }
  | PageBase & {
    kind: 'suburb';
    state: StateSummary;
    suburb: SuburbSummary;
    clinics: ClinicSummary[];
    nearby: SuburbSummary[];
  }
  | PageBase & { kind: 'clinic'; state: StateSummary; suburb: SuburbSummary; clinic: PublicClinic; others: ClinicSummary[] };

export interface DirectoryRedirect {
  /** Old clinic URL (a retired slug at the clinic's current state and suburb). */
  from: string;
  to: string;
}

export interface DirectoryIndex {
  pages: DirectoryPage[];
  byPath: Map<string, DirectoryPage>;
  redirects: DirectoryRedirect[];
}

/** Indexed only with enough real content to be useful: a description, opening hours and services. */
export const isIndexableClinic = (clinic: PublicClinic) =>
  Boolean(clinic.description) && openDays(clinic).length > 0 && clinic.services.length > 0;

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, 'en-AU');

const latest = (dates: (string | null | undefined)[]) =>
  dates.filter((date): date is string => Boolean(date)).sort().at(-1);

/** The spelling most clinics in the group use, e.g. "North Sydney" over "North sydney". */
function commonName(names: string[]): string {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function summarise(clinic: PublicClinic): ClinicSummary {
  return {
    slug: clinic.slug,
    name: clinic.name,
    path: clinicPath(clinic),
    street: clinic.address.street,
    postcode: clinic.address.postcode,
    phone: clinic.phone,
    services: clinic.services.slice(0, 4),
    openDays: openDays(clinic).length,
    acceptsOnlineBooking: clinic.acceptsOnlineBooking,
  };
}

/** Same-named clinics get their street added, then their unique slug if titles still collide. */
function dedupeTitles(pages: DirectoryPage[]) {
  const seen = new Map<string, DirectoryPage[]>();
  for (const page of pages) seen.set(page.seo.title, [...(seen.get(page.seo.title) ?? []), page]);
  for (const group of seen.values()) {
    if (group.length < 2) continue;
    for (const page of group) {
      if (page.kind !== 'clinic') continue;
      const where = page.clinic.address.street ?? page.clinic.address.postcode ?? page.clinic.slug;
      page.seo = { ...page.seo, title: `${page.clinic.name}, ${where} – ${page.clinic.address.suburb}` };
    }
  }

  const titles = new Set<string>();
  for (const page of pages) {
    if (page.kind === 'clinic' && titles.has(page.seo.title)) {
      page.seo = { ...page.seo, title: `${page.clinic.name} – ${page.clinic.slug}` };
    }
    titles.add(page.seo.title);
  }
}

/**
 * Groups the directory into state, suburb and clinic pages, and decides which
 * of them search engines should index.
 */
export function buildDirectory(directory: PublicDirectory): DirectoryIndex {
  const states = new Map<string, Map<string, PublicClinic[]>>();
  for (const clinic of directory.clinics) {
    const suburbs = states.get(clinic.address.state) ?? new Map<string, PublicClinic[]>();
    const key = slugify(clinic.address.suburb);
    suburbs.set(key, [...(suburbs.get(key) ?? []), clinic]);
    states.set(clinic.address.state, suburbs);
  }

  const pages: DirectoryPage[] = [];
  const stateSummaries: StateSummary[] = [];
  let anyIndexableState = false;

  for (const [code, suburbs] of [...states.entries()].sort((a, b) => stateName(a[0]).localeCompare(stateName(b[0])))) {
    const stateClinics = [...suburbs.values()].flat();
    const state: StateSummary = {
      code,
      name: stateName(code),
      path: statePath(code),
      clinicCount: stateClinics.length,
      suburbCount: suburbs.size,
    };
    stateSummaries.push(state);

    const suburbSummaries: SuburbSummary[] = [...suburbs.values()].map((clinics) => {
      const name = commonName(clinics.map((clinic) => clinic.address.suburb));
      return {
        name,
        path: suburbPath(code, name),
        clinicCount: clinics.length,
        postcodes: [...new Set(clinics.map((clinic) => clinic.address.postcode).filter(Boolean) as string[])].sort(),
      };
    }).sort(byName);

    let anyIndexableSuburb = false;
    for (const suburb of suburbSummaries) {
      // Every clinic page uses the suburb's common spelling.
      const clinics = (suburbs.get(slugify(suburb.name)) ?? [])
        .map((clinic) => ({ ...clinic, address: { ...clinic.address, suburb: suburb.name } }))
        .sort(byName);
      const summaries = clinics.map(summarise);
      const suburbIndexed = clinics.length >= SUBURB_INDEX_MIN_CLINICS;
      anyIndexableSuburb ||= suburbIndexed;

      pages.push({
        kind: 'suburb',
        path: suburb.path,
        state,
        suburb,
        clinics: summaries,
        nearby: suburbSummaries.filter((other) => other.path !== suburb.path).slice(0, 8),
        seo: suburbSeo(
          { state: code, suburb: suburb.name, path: suburb.path, statePath: state.path, clinicCount: clinics.length, postcodes: suburb.postcodes },
          suburbIndexed,
          latest(clinics.map((clinic) => clinic.updatedAt)),
        ),
      });

      for (const clinic of clinics) {
        const path = clinicPath(clinic);
        pages.push({
          kind: 'clinic',
          path,
          state,
          suburb,
          clinic,
          others: summaries.filter((other) => other.slug !== clinic.slug),
          seo: clinicSeo(clinic, { path, suburbPath: suburb.path, statePath: state.path }, isIndexableClinic(clinic)),
        });
      }
    }

    anyIndexableState ||= anyIndexableSuburb;
    pages.push({
      kind: 'state',
      path: state.path,
      state,
      suburbs: suburbSummaries,
      seo: stateSeo(
        { state: code, path: state.path, clinicCount: state.clinicCount, suburbCount: state.suburbCount },
        anyIndexableSuburb,
        latest(stateClinics.map((clinic) => clinic.updatedAt)),
      ),
    });
  }

  pages.unshift({
    kind: 'country',
    path: DIRECTORY_PATH,
    states: stateSummaries,
    clinicCount: directory.clinics.length,
    seo: countrySeo(anyIndexableState, latest(directory.clinics.map((clinic) => clinic.updatedAt))),
  });

  dedupeTitles(pages);
  const byPath = new Map(pages.map((page) => [page.path, page]));

  // A renamed clinic keeps its retired slugs; old URLs in the same suburb
  // redirect to the current page. (A move to another suburb changes the whole
  // path, which can't be traced back.)
  const redirects: DirectoryRedirect[] = [];
  for (const clinic of directory.clinics) {
    const to = clinicPath(clinic);
    for (const slug of clinic.previousSlugs) {
      const from = clinicPath({ slug, address: clinic.address });
      if (from !== to && !byPath.has(from)) redirects.push({ from, to });
    }
  }

  return { pages, byPath, redirects };
}
