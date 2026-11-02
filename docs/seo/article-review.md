# Reviewing and publishing Learn articles

The seven guides under `/learn/<slug>` are health content, which search engines hold to a higher standard ("Your Money or Your Life"). Pages rank better, and readers trust them more, when they are accurate, sourced and reviewed by a qualified person who is named on the page.

## What is live and what is a draft

| File | Status |
| --- | --- |
| `src/content/articles/<slug>.md` | **Published.** The original short text, moved unchanged from the old Learn page. |
| `src/content/articles/drafts/<slug>.md` | **Draft, not published.** Expanded versions (about 600–850 words) in Australian English, with sources. They are never routed, prerendered or listed in the sitemap. |
| `src/content/articles/index.ts` | Metadata for every article: titles, description, tags, image, dates, reviewer and references. |

The drafts were written for review. Do not publish them until a registered dentist has checked them.

## Review checklist (for the reviewing dentist)

1. Is every statement clinically accurate and current for Australia?
2. Is the advice safe for a general reader? Does it say clearly when to see a dentist and when to seek urgent care?
3. Is anything missing that patients in Australia commonly ask? For example: typical costs, the Child Dental Benefits Schedule, public dental services, or private health cover.
4. Do the sources support the text? Replace or add sources as needed, preferring healthdirect, the Australian Dental Association (teeth.org.au), Cancer Council and government health departments.
5. Is the wording plain English (en-AU spelling), free of jargon, and not promotional?

## Publishing a reviewed draft

1. Move the reviewed text into `src/content/articles/<slug>.md`. Delete the `<!-- DRAFT … -->` comment at the top and the `## Sources` section, because sources render from the metadata.
2. In `src/content/articles/index.ts`, update the article:
   - `references`: one entry per source (`title`, `publisher`, `url`).
   - `reviewer`: the reviewer's real name and credentials, for example `{ name: 'Dr Jane Citizen', credentials: 'BDS, general dentist, AHPRA DEN0001234567' }`. Use their consent and their real registration; never invent one.
   - `dateModified`: the date the new text goes live (`YYYY-MM-DD`).
   - `description` and `seoTitle`: revise them if the article's focus changed. Keep the title under 60 characters including " | DentistDSS", and the description between 70 and 160 characters.
3. Delete the draft file.
4. Run the checks, then build:

   ```bash
   deno task check
   ```

   ```bash
   deno task test
   ```

   ```bash
   deno task build
   ```

   The build prerenders the article and fails if its title, canonical, heading or structured data are missing or duplicated. The page then shows "Reviewed by …", the `Article` structured data gains a `reviewedBy` entry, and the sitemap `<lastmod>` updates.

## Adding a new article

1. Add an image pair to `public/images/learn/`: `<slug>.webp` (1600px wide) and `<slug>-card.webp` (800px wide, half size). Use a descriptive file name.
2. Add metadata to `ARTICLES` in `src/content/articles/index.ts`.
3. Add the body as `src/content/articles/<slug>.md`. Start with a short paragraph that answers the question directly. Use `##` headings for sections, never `#`, because the page already has its heading.
4. Run the checks and build as above. The new page, its route, its structured data and its sitemap entry all come from the metadata. `vercel.json` already serves `/learn/:slug`.
