/**
 * The public clinic directory, as served by GET /api/public/clinics
 * (clinic-service PublicClinicResponse). Only approved, active, opted-in
 * clinics appear, with public fields only.
 */

export interface PublicOperatingHours {
  /** 0 (Sunday) to 6 (Saturday). */
  dayOfWeek: number;
  /** HH:mm; a closed day may still carry times. */
  openTime: string | null;
  closeTime: string | null;
  isOpen: boolean;
}

export interface PublicClinic {
  slug: string;
  previousSlugs: string[];
  name: string;
  description: string | null;
  address: {
    street: string | null;
    /** Consistently capitalised, e.g. "North Sydney". */
    suburb: string;
    /** NSW, VIC, QLD, WA, SA, TAS, ACT or NT. */
    state: string;
    postcode: string | null;
    country: string;
  };
  location: { latitude: number; longitude: number } | null;
  phone: string | null;
  /** Absolute http(s) URL, or null. */
  website: string | null;
  operatingHours: PublicOperatingHours[];
  services: string[];
  /** True when the clinic has at least one bookable service. */
  acceptsOnlineBooking: boolean;
  /** ISO-8601 UTC, second precision. */
  updatedAt: string | null;
}

export interface PublicDirectory {
  generatedAt: string;
  clinics: PublicClinic[];
}
