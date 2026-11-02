# Public clinics API (for clinic and suburb pages)

**Status:** proposal for the backend (`dentistdss-microservices`). The frontend clinic pages (Phase 4 of the SEO plan) are built against this contract.

## Why

Searches like "dentist in Parramatta" and "<clinic name> dentist" are the largest source of organic traffic for a booking site. To rank for them, each listed clinic needs its own page, and each suburb needs a hub page, with the content in the HTML. The build prerenders these pages from this endpoint, the same way it already prerenders the Learn and For clinics pages.

## Pages this enables

| URL | Content | Indexed when |
| --- | --- | --- |
| `/dentists/{state}` | Suburbs in the state that have listed clinics | the state has at least one indexable suburb |
| `/dentists/{state}/{suburb}` | The clinics in a suburb, with a map and opening hours | it has at least 3 listed clinics |
| `/dentists/{state}/{suburb}/{slug}` | One clinic: address, map, hours, services, phone, website, "Book online" | it has a description, opening hours and at least one service |

Pages that don't meet the bar are still served, but marked `noindex`, so there are no thin or doorway pages in search. Example: `/dentists/nsw/parramatta/smile-dental-parramatta`.

## Endpoints

Both endpoints are unauthenticated and read-only, and they return only clinics that are **approved, active and opted in** (`listedPublicly = true`).

### `GET /api/public/clinics`

Returns every listed clinic. The build calls it once, so pagination is optional while there are fewer than about 2,000 clinics.

```json
{
  "generatedAt": "2026-11-02T00:00:00Z",
  "clinics": [
    {
      "slug": "smile-dental-parramatta",
      "previousSlugs": ["smile-dental"],
      "name": "Smile Dental Parramatta",
      "description": "Family dental clinic near Parramatta station…",
      "address": {
        "street": "123 Church Street",
        "suburb": "Parramatta",
        "state": "NSW",
        "postcode": "2150",
        "country": "AU"
      },
      "location": { "latitude": -33.8150, "longitude": 151.0011 },
      "phone": "+61 2 9000 0000",
      "website": "https://smiledental.example",
      "operatingHours": [
        { "dayOfWeek": 1, "openTime": "08:30", "closeTime": "17:30", "isOpen": true }
      ],
      "services": ["Check-up and clean", "Fillings", "Children's dentistry"],
      "acceptsOnlineBooking": true,
      "updatedAt": "2026-10-30T04:12:00Z"
    }
  ]
}
```

### `GET /api/public/clinics/{slug}`

Returns one clinic in the same shape. For an old slug, it returns `301` with `Location: /api/public/clinics/{currentSlug}`. Returns `404` when the clinic is unknown or not listed.

## Field rules

- **`slug`:** lowercase, hyphenated, unique and stable; generated from the name and suburb when a clinic is approved. A rename keeps the old value in `previousSlugs`, so the frontend can 301-redirect old URLs.
- **`state`:** an Australian state or territory code (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`). The URL uses it in lowercase.
- **`suburb`:** as entered by the clinic, with consistent capitalisation. The URL uses it lowercased and hyphenated.
- **`operatingHours.dayOfWeek`:** `0` (Sunday) to `6` (Saturday), matching `OperatingHours` in `src/types/api.ts`.
- **Public fields only.** Never include staff, patient, email or internal IDs.

## Operational requirements

- `Cache-Control: public, max-age=300` and an `ETag`.
- Rate-limit by IP; the build makes one request per deployment.
- CORS isn't needed, because the build calls the API server to server.
- **Rebuild trigger:** when a clinic is approved, updated, delisted or deleted, call the Vercel Deploy Hook for the `dentistdss` project. Debounce to at most one call per hour, so the static pages refresh without a deploy on every edit. Store the hook URL as a backend secret.
- **Opt-in:** add a "Show my clinic in public search" setting (`listedPublicly`) to clinic settings, on by default for new clinics only if the clinic agrees in the registration terms.

## Frontend behaviour (for reference)

- The prerender (`src/seo/prerender.ts`) fetches `GET /api/public/clinics` from `VITE_API_HOST` at build time. If the request fails, the production build fails, so Vercel keeps serving the previous deployment instead of dropping every clinic page.
- **Clinic pages:**
  - `Dentist` JSON-LD (a LocalBusiness subtype): `address`, `geo`, `telephone`, `url`, `openingHoursSpecification`, and `potentialAction: ReserveAction`, which links to booking.
  - `BreadcrumbList` JSON-LD.
- **Links:** results on `/find-a-clinic` link to the clinic pages with plain `<a href>` links, so crawlers can follow them.
- **Reviews:** before adding patient reviews or testimonials to clinic pages, check the Australian health practitioner (AHPRA) advertising rules. Only genuine, independently collected reviews may be marked up.
