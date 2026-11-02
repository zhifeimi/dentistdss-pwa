import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadDirectory } from '../../src/directory/load';
import { buildDirectory, isIndexableClinic, SUBURB_INDEX_MIN_CLINICS } from '../../src/directory/model';
import { clinicPath, slugify, stateCodeOf } from '../../src/directory/paths';
import { dentistJsonLd } from '../../src/directory/seo';
import { validateDirectory } from '../../src/directory/validate';

const FIXTURE = resolve(process.cwd(), 'tests/fixtures/public-clinics.json');
const raw = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const { directory, dropped } = validateDirectory(raw);
const index = buildDirectory(directory);
const page = (path: string) => index.byPath.get(path);

describe('directory paths', () => {
  it('slugifies the way the backend builds clinic slugs', () => {
    expect(slugify('Smile Dental Parramatta')).toBe('smile-dental-parramatta');
    expect(slugify("O'Connor")).toBe('oconnor');
    expect(slugify('St Kilda & Co')).toBe('st-kilda-and-co');
    expect(slugify('  Mount  Lawley ')).toBe('mount-lawley');
    expect(slugify('Café Straße')).toBe('cafe-strasse');
    expect(slugify('')).toBe('');
  });

  it('reads state codes and full names as the backend does', () => {
    expect(stateCodeOf('nsw')).toBe('NSW');
    expect(stateCodeOf('N.S.W.')).toBe('NSW');
    expect(stateCodeOf('New  South Wales')).toBe('NSW');
    expect(stateCodeOf('Victoria')).toBe('VIC');
    expect(stateCodeOf('Auckland')).toBeNull();
  });

  it('builds clinic URLs from state, suburb and slug', () => {
    expect(clinicPath({ slug: 'a-b', address: { state: 'NSW', suburb: 'North Sydney' } }))
      .toBe('/dentists/nsw/north-sydney/a-b');
  });
});

describe('validating the API response', () => {
  it('drops clinics that cannot have a page and says why', () => {
    expect(directory.clinics.map((clinic) => clinic.slug)).not.toContain('not-in-australia');
    expect(dropped).toEqual(['not-in-australia: state "AKL" is not an Australian state code']);
  });

  it('rejects a malformed envelope outright', () => {
    expect(() => validateDirectory({ data: [] })).toThrow(/expected \{ generatedAt, clinics/);
  });

  it('keeps one entry per day and treats an open day without valid times as closed', () => {
    const { directory: parsed } = validateDirectory({
      generatedAt: 'x',
      clinics: [{
        slug: 'a',
        name: 'A',
        address: { suburb: 'X', state: 'NSW' },
        operatingHours: [
          { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isOpen: true },
          { dayOfWeek: 1, openTime: '10:00', closeTime: '11:00', isOpen: true },
          { dayOfWeek: 2, openTime: '18:00', closeTime: '09:00', isOpen: true },
          { dayOfWeek: 9, openTime: '09:00', closeTime: '17:00', isOpen: true },
        ],
        website: 'javascript:alert(1)',
      }],
    });
    const clinic = parsed.clinics[0];
    expect(clinic.operatingHours).toEqual([
      { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isOpen: true },
      { dayOfWeek: 2, openTime: '18:00', closeTime: '09:00', isOpen: false },
    ]);
    expect(clinic.website).toBeNull();
    expect(clinic.services).toEqual([]);
  });
});

describe('directory pages', () => {
  it('creates country, state, suburb and clinic pages', () => {
    expect(index.pages.map(({ path }) => path).sort()).toEqual([
      '/dentists',
      '/dentists/nsw',
      '/dentists/nsw/north-sydney',
      '/dentists/nsw/north-sydney/berry-street-dental-north-sydney',
      '/dentists/nsw/north-sydney/harbourside-dental-north-sydney',
      '/dentists/nsw/north-sydney/miller-street-smiles-north-sydney',
      '/dentists/vic',
      '/dentists/vic/fitzroy',
      '/dentists/vic/fitzroy/fitzroy-dental-fitzroy',
    ]);
  });

  it('groups suburbs whatever their capitalisation, under the common spelling', () => {
    const suburb = page('/dentists/nsw/north-sydney');
    expect(suburb?.kind).toBe('suburb');
    if (suburb?.kind !== 'suburb') return;
    expect(suburb.suburb).toMatchObject({ name: 'North Sydney', clinicCount: 3, postcodes: ['2060'] });
    expect(suburb.clinics.map(({ name }) => name)).toEqual(['Berry Street Dental', 'Harbourside Dental', 'Miller Street Smiles']);
    const berry = page('/dentists/nsw/north-sydney/berry-street-dental-north-sydney');
    expect(berry?.seo.title).toContain('North Sydney');
  });

  it(`indexes clinics with real content and suburbs with ${SUBURB_INDEX_MIN_CLINICS}+ clinics`, () => {
    const indexed = index.pages.filter(({ seo }) => seo.index).map(({ path }) => path).sort();
    expect(indexed).toEqual([
      '/dentists',
      '/dentists/nsw',
      '/dentists/nsw/north-sydney',
      '/dentists/nsw/north-sydney/berry-street-dental-north-sydney',
      '/dentists/nsw/north-sydney/harbourside-dental-north-sydney',
      '/dentists/nsw/north-sydney/miller-street-smiles-north-sydney',
    ]);
    const sparse = directory.clinics.find(({ slug }) => slug === 'fitzroy-dental-fitzroy')!;
    expect(isIndexableClinic(sparse)).toBe(false);
  });

  it('keeps an empty directory to a single noindex country page', () => {
    const empty = buildDirectory({ generatedAt: 'x', clinics: [] });
    expect(empty.pages).toHaveLength(1);
    expect(empty.pages[0]).toMatchObject({ kind: 'country', path: '/dentists', clinicCount: 0 });
    expect(empty.pages[0].seo.index).toBe(false);
  });

  it('redirects retired slugs in the same suburb to the current page', () => {
    expect(index.redirects).toEqual([{
      from: '/dentists/nsw/north-sydney/harbourside-dental',
      to: '/dentists/nsw/north-sydney/harbourside-dental-north-sydney',
    }]);
  });

  it('writes unique titles and descriptions that fit search results', () => {
    const titles = index.pages.map(({ seo }) => seo.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const { seo } of index.pages) {
      expect(seo.title.length, seo.title).toBeLessThanOrEqual(60);
      expect(seo.description.length, seo.description).toBeLessThanOrEqual(160);
    }
  });

  it('gives two same-named clinics in one suburb different titles', () => {
    const twin = { ...directory.clinics[0], slug: 'harbourside-dental-north-sydney-2', previousSlugs: [], address: { ...directory.clinics[0].address, street: '1 Walker Street' } };
    const twins = buildDirectory({ ...directory, clinics: [...directory.clinics, twin] });
    const titles = twins.pages.filter(({ kind }) => kind === 'clinic').map(({ seo }) => seo.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('Dentist structured data', () => {
  const full = directory.clinics.find(({ slug }) => slug === 'harbourside-dental-north-sydney')!;
  const sparse = directory.clinics.find(({ slug }) => slug === 'fitzroy-dental-fitzroy')!;

  it('describes a clinic with address, geo, hours, website and booking', () => {
    const node = dentistJsonLd(full, clinicPath(full));
    expect(node).toMatchObject({
      '@type': 'Dentist',
      name: 'Harbourside Dental',
      url: 'https://dentist.zhifei.org/dentists/nsw/north-sydney/harbourside-dental-north-sydney',
      telephone: '+61 2 9000 0001',
      address: { streetAddress: '12 Miller Street', addressLocality: 'North Sydney', addressRegion: 'NSW', postalCode: '2060', addressCountry: 'AU' },
      geo: { latitude: -33.8393, longitude: 151.2073 },
      sameAs: ['https://harbourside.example'],
    });
    // Sunday is closed in the data, so only six days are open.
    expect(node.openingHoursSpecification).toHaveLength(6);
    expect((node.potentialAction as { target: { urlTemplate: string } }).target.urlTemplate)
      .toBe('https://dentist.zhifei.org/appointments?book=harbourside-dental-north-sydney');
  });

  it('leaves out what the clinic has not provided', () => {
    const node = dentistJsonLd(sparse, clinicPath(sparse));
    for (const key of ['description', 'geo', 'openingHoursSpecification', 'sameAs', 'potentialAction']) {
      expect(node, key).not.toHaveProperty(key);
    }
    expect(node.address).not.toHaveProperty('streetAddress');
  });
});

describe('loading the directory at build time', () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

  it('reads a fixture when one is given', async () => {
    const loaded = await loadDirectory({ fixturePath: FIXTURE, apiHost: 'https://ignored.example' });
    expect(loaded.source).toBe('fixture');
    expect(loaded.directory.clinics).toHaveLength(4);
  });

  it('builds without clinic pages when no https API host is configured', async () => {
    const fetchImpl = vi.fn();
    for (const apiHost of [undefined, '', 'http://localhost']) {
      const loaded = await loadDirectory({ apiHost, fetchImpl });
      expect(loaded).toMatchObject({ source: 'none', directory: { clinics: [] } });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fetches the public endpoint from the API host', async () => {
    const fetchImpl = vi.fn(async () => ok(raw));
    const loaded = await loadDirectory({ apiHost: 'https://api.example/', fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example/api/public/clinics', expect.anything());
    expect(loaded.source).toBe('api');
    expect(loaded.directory.clinics).toHaveLength(4);
    expect(loaded.dropped).toHaveLength(1);
  });

  it('retries, then fails the build rather than publishing no clinic pages', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 502 }));
    await expect(loadDirectory({ apiHost: 'https://api.example', fetchImpl, retries: 2, retryDelayMs: 0 }))
      .rejects.toThrow('Could not load the public clinic directory from https://api.example/api/public/clinics: HTTP 502');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('recovers when a retry succeeds', async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(ok({ generatedAt: 'x', clinics: [] }));
    const loaded = await loadDirectory({ apiHost: 'https://api.example', fetchImpl, retryDelayMs: 0 });
    expect(loaded.source).toBe('api');
  });
});
