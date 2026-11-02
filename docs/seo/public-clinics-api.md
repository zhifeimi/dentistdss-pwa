# Public clinics API (for clinic and suburb pages)

**Status:** built. The backend is `dentistdss-microservices` (clinic-service `PublicClinicController`, live at `https://api.mizhifei.press`). The frontend is `src/directory/` and `src/pages/Dentists/` in this repo.

## Why

Searches like "dentist in Parramatta" and "<clinic name> dentist" are the largest source of organic traffic for a booking site. To rank for them, each listed clinic needs its own page, and each suburb needs a hub page, with the content in the HTML. The build prerenders these pages from this endpoint, the same way it already prerenders the Learn and For clinics pages.

## Pages this enables

| URL | Content | Indexed when |
| --- | --- | --- |
| `/dentists/{state}` | Suburbs in the state that have listed clinics | the state has at least one indexable suburb |
| `/dentists/{state}/{suburb}` | The clinics in a suburb | it has at least 3 listed clinics |
| `/dentists/{state}/{suburb}/{slug}` | One clinic: address, directions link, hours, services, phone, website, "Book online" | it has a description, opening hours and at least one service |

Pages that don't meet the bar are still served, but marked `noindex`, so there are no thin or doorway pages in search. Example: `/dentists/nsw/parramatta/smile-dental-parramatta`.

## Endpoints

Both endpoints are unauthenticated and read-only, and they return only clinics that are **approved, active and opted in** (`listedPublicly = true`).

### `GET /api/public/clinics`

Returns every listed clinic. The build makes one logical directory load, with up to three HTTP attempts on failure, so pagination is optional while there are fewer than about 2,000 clinics.

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

- **`slug`:** lowercase, hyphenated, unique and stable; generated from the name and suburb when a clinic is approved. A rename keeps the old value in `previousSlugs`, so the frontend can send old URLs to the current clinic page with an instant meta refresh and a canonical link.
- **`state`:** an Australian state or territory code (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`). The URL uses it in lowercase.
- **`suburb`:** as entered by the clinic, with consistent capitalisation. The URL uses it lowercased and hyphenated.
- **`operatingHours.dayOfWeek`:** `0` (Sunday) to `6` (Saturday), matching `OperatingHours` in `src/types/api.ts`.
- **Public fields only.** Never include staff, patient, email or internal IDs.

## Operational requirements

- `Cache-Control: public, max-age=300` and an `ETag`.
- Rate-limit by IP; a deployment makes up to three HTTP requests when retries are needed.
- CORS isn't needed for production builds, which call the API server to server. Browser navigation in development calls the API directly, so cross-origin local development needs CORS or a same-origin proxy.
- **Rebuild trigger:** when a clinic is approved, updated, delisted or deleted, call the Vercel Deploy Hook for the `dentistdss` project. Debounce to at most one call per hour, so the static pages refresh without a deploy on every edit. Store the hook URL as a backend secret.
- **Opt-in:** add a "Show my clinic in public search" setting (`listedPublicly`) to clinic settings, on by default for new clinics only if the clinic agrees in the registration terms.

## Frontend behaviour (as built)

- **Build:** `vite build` (see `src/directory/load.ts`) loads the directory:
  - It uses `PUBLIC_CLINICS_FIXTURE` when that is set.
  - Otherwise, when `VITE_API_HOST` is an https origin, it fetches `GET ${VITE_API_HOST}/api/public/clinics` (15 s timeout, 2 retries).
  - With no fixture and an unset or blank `VITE_API_HOST`, it builds without clinic pages. A nonempty invalid host fails the build.
- **Failures:** if an API host is configured and the fetch fails, the build fails, so Vercel keeps serving the last good deployment instead of dropping every clinic page. A nonempty API response whose clinics are all invalid also fails the build; an empty `clinics` list is allowed.
- **Validation:** records are checked (`src/directory/validate.ts`). A clinic with an invalid slug, a missing or unusable suburb, or a non-Australian state is left out with a build warning. An open day without a valid time range is treated as closed. Malformed website URLs and timestamps are discarded.
- **Pages** (`src/directory/model.ts`): `/dentists`, `/dentists/{state}`, `/dentists/{state}/{suburb}` and `/dentists/{state}/{suburb}/{slug}`.
  - The state segment is the lowercase state code.
  - The suburb segment uses the same slug rule as `ClinicSlugs.slugify`.
  - Suburbs are grouped by that slug and shown with the most common spelling.
- **Indexing rules:**
  - a clinic page is indexed with a description, at least one open day and at least one service
  - a suburb page is indexed with 3 or more clinics
  - a state page is indexed when it has an indexable suburb
  - `/dentists` is indexed when it has an indexable state
  - Everything else is served with `noindex, follow` and left out of the sitemap.
- **Structured data:** clinic pages carry `Dentist` JSON-LD with:
  - address
  - geo (when known)
  - telephone
  - opening hours
  - `sameAs` (website)
  - `ReserveAction` → `/appointments?book={slug}` when `acceptsOnlineBooking`
  - `BreadcrumbList` on every page.
- **Retired slugs:** each entry in `previousSlugs` gets a redirect page at the clinic's *current* state and suburb (instant meta refresh plus a canonical). If a clinic moves suburb, its old URL can't be traced back and returns 404.
- **Search:** Find a clinic searches with `POST /api/clinic/search`. Results that have a page in this build (looked up in `/data/directory.json`) link to it.
- **Clinic admins:**
  - Opt in at sign-up (`listedPublicly`), or later under Settings → Public listing (description, website, listing switch).
  - They set opening hours on the Opening hours page (`PUT /api/clinic/{id}` `operatingHours`).
- **Reviews:** before adding patient reviews or testimonials to clinic pages, check the Australian health practitioner (AHPRA) advertising rules. Only genuine, independently collected reviews may be marked up.
