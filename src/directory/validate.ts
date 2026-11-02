import { STATE_NAMES } from './paths.ts';
import type { PublicClinic, PublicDirectory, PublicOperatingHours } from './types.ts';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

type Raw = Record<string, unknown>;
const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
const isSlug = (value: unknown): value is string => typeof value === 'string' && value.length <= 160 && SLUG.test(value);

function hours(raw: unknown): PublicOperatingHours[] {
  if (!Array.isArray(raw)) return [];
  const days = new Map<number, PublicOperatingHours>();
  for (const entry of raw) {
    if (!isObject(entry) || !Number.isInteger(entry.dayOfWeek)) continue;
    const dayOfWeek = entry.dayOfWeek as number;
    if (dayOfWeek < 0 || dayOfWeek > 6 || days.has(dayOfWeek)) continue;
    const openTime = typeof entry.openTime === 'string' && TIME.test(entry.openTime) ? entry.openTime : null;
    const closeTime = typeof entry.closeTime === 'string' && TIME.test(entry.closeTime) ? entry.closeTime : null;
    // An "open" day without a valid time range can't be shown or marked up.
    const isOpen = entry.isOpen === true && openTime !== null && closeTime !== null && openTime < closeTime;
    days.set(dayOfWeek, { dayOfWeek, openTime, closeTime, isOpen });
  }
  return [...days.values()].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

const website = (value: unknown) => {
  const url = text(value);
  return url && /^https?:\/\/[^\s/]+/i.test(url) ? url : null;
};

/** One clinic, or why it can't be listed. */
function clinic(raw: unknown): PublicClinic | string {
  if (!isObject(raw)) return 'not an object';
  if (!isSlug(raw.slug)) return `invalid slug ${JSON.stringify(raw.slug)}`;
  const name = text(raw.name);
  if (!name) return `${raw.slug}: no name`;
  const address = isObject(raw.address) ? raw.address : {};
  const suburb = text(address.suburb);
  const state = text(address.state);
  if (!suburb) return `${raw.slug}: no suburb`;
  if (!state || !(state in STATE_NAMES)) return `${raw.slug}: state ${JSON.stringify(address.state)} is not an Australian state code`;
  const location = isObject(raw.location) && Number.isFinite(raw.location.latitude) && Number.isFinite(raw.location.longitude)
    ? { latitude: raw.location.latitude as number, longitude: raw.location.longitude as number }
    : null;
  const services = Array.isArray(raw.services) ? raw.services.map(text).filter((s): s is string => s !== null) : [];

  return {
    slug: raw.slug,
    previousSlugs: Array.isArray(raw.previousSlugs) ? raw.previousSlugs.filter(isSlug) : [],
    name,
    description: text(raw.description),
    address: { street: text(address.street), suburb, state, postcode: text(address.postcode), country: 'AU' },
    location,
    phone: text(raw.phone),
    website: website(raw.website),
    operatingHours: hours(raw.operatingHours),
    services,
    acceptsOnlineBooking: raw.acceptsOnlineBooking === true,
    updatedAt: text(raw.updatedAt),
  };
}

/**
 * Checks a GET /api/public/clinics body. A malformed envelope throws; a
 * clinic that can't be shown is dropped and reported, so one bad record never
 * takes the other clinic pages down.
 */
export function validateDirectory(raw: unknown): { directory: PublicDirectory; dropped: string[] } {
  if (!isObject(raw) || !Array.isArray(raw.clinics)) {
    throw new Error('Public clinic directory: expected { generatedAt, clinics: [...] }');
  }
  const clinics: PublicClinic[] = [];
  const dropped: string[] = [];
  const slugs = new Set<string>();
  for (const entry of raw.clinics) {
    const result = clinic(entry);
    if (typeof result === 'string') dropped.push(result);
    else if (slugs.has(result.slug)) dropped.push(`${result.slug}: duplicate slug`);
    else {
      slugs.add(result.slug);
      clinics.push(result);
    }
  }
  return { directory: { generatedAt: text(raw.generatedAt) ?? new Date(0).toISOString(), clinics }, dropped };
}
