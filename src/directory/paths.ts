/**
 * URLs for the public clinic pages:
 *   /dentists                                  every state
 *   /dentists/{state}                          e.g. /dentists/nsw
 *   /dentists/{state}/{suburb}                 e.g. /dentists/nsw/north-sydney
 *   /dentists/{state}/{suburb}/{clinic-slug}   the clinic page
 */

export const DIRECTORY_PATH = '/dentists';

export const STATE_NAMES: Readonly<Record<string, string>> = {
  ACT: 'Australian Capital Territory',
  NSW: 'New South Wales',
  NT: 'Northern Territory',
  QLD: 'Queensland',
  SA: 'South Australia',
  TAS: 'Tasmania',
  VIC: 'Victoria',
  WA: 'Western Australia',
};

const SPECIAL_LETTERS: [string, string][] = [
  ['ß', 'ss'], ['æ', 'ae'], ['Æ', 'AE'], ['ø', 'o'], ['Ø', 'O'], ['đ', 'd'], ['Đ', 'D'], ['ł', 'l'], ['Ł', 'L'],
];

/**
 * Lowercase ASCII words joined by single hyphens. A port of the backend's
 * ClinicSlugs.slugify, so suburb segments match the clinic slugs it makes:
 * "St Kilda & Co" -> "st-kilda-and-co", "O'Connor" -> "oconnor".
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return '';
  let value = text;
  for (const [from, to] of SPECIAL_LETTERS) value = value.replaceAll(from, to);
  return value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replace(/['‘’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const stateSlug = (stateCode: string) => stateCode.toLowerCase();

export const statePath = (stateCode: string) => `${DIRECTORY_PATH}/${stateSlug(stateCode)}`;

export const suburbPath = (stateCode: string, suburb: string) =>
  `${statePath(stateCode)}/${slugify(suburb)}`;

export const clinicPath = (clinic: { slug: string; address: { state: string; suburb: string } }) =>
  `${suburbPath(clinic.address.state, clinic.address.suburb)}/${clinic.slug}`;

export const stateName = (stateCode: string) =>
  Object.hasOwn(STATE_NAMES, stateCode) ? STATE_NAMES[stateCode] : stateCode;

const STATE_ALIASES: Readonly<Record<string, string>> = {
  'new south wales': 'NSW', victoria: 'VIC', queensland: 'QLD', 'western australia': 'WA',
  'south australia': 'SA', tasmania: 'TAS', 'australian capital territory': 'ACT', 'northern territory': 'NT',
};

/** NSW, VIC, ... from a code or full name in any case ("N.S.W." too), as the backend reads it. */
export function stateCodeOf(state: string | null | undefined): string | null {
  const key = (state ?? '').replaceAll('.', '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!key) return null;
  const code = key.toUpperCase();
  if (Object.hasOwn(STATE_ALIASES, key)) return STATE_ALIASES[key];
  return Object.hasOwn(STATE_NAMES, code) ? code : null;
}
