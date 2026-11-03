# Monthly search review

A 30-minute routine to get more clicks from the searches DentistDSS already appears in. Run it on the first working day of each month and log every change in [changelog.md](changelog.md).

## 1. Check that pages are indexed (5 minutes)

In Google Search Console, open **Indexing → Pages**:
- **"Not indexed" reasons.** "Crawled – currently not indexed" on a guide or clinic page usually means thin content. Improve the page rather than resubmitting it.
- **Sitemaps.** `https://dentist.zhifei.org/sitemap.xml` should show *Success*, and the number of discovered URLs should match the number of indexable pages.
- In Bing Webmaster Tools, check **Sitemaps** and **IndexNow** the same way.

## 2. Find pages that rank but don't get clicked (15 minutes)

Search Console → **Performance → Search results**, last 28 days, compared with the previous 28 days. Tick *Average CTR* and *Average position*, then open the **Pages** tab.

Look for pages with:
- an average position between 3 and 15, and
- a CTR well below what that position usually earns. Rough benchmarks: about 10% at position 3, 5% at 5, 2% at 10.

For each one (at most three a month, so the effect of each change can be measured):
1. Open the page's **Queries**. What are people actually searching for?
2. Rewrite the title and/or description so they answer that search directly. Keep to:
   - the search intent first and `| DentistDSS` last
   - a title of 60 characters or fewer and a description of 70–160 characters
   - Australian English
   - only claims that are true on the page (no "free", "best" or "#1" unless provable)
3. Make the change where the copy lives:
   - static pages: `src/seo/pages.ts`
   - guides: `seoTitle` and `description` in `src/content/articles/index.ts`
   - the For clinics pages: `src/content/forClinics.ts`
   - clinic and suburb pages: the templates in `src/directory/seo.ts`
4. Run `deno task test`. The registry tests catch duplicate, too-long or too-short titles and descriptions.
5. Add a row to `changelog.md` with the page's clicks, impressions, CTR and position for the last 28 days.

## 3. Look back at last month's changes (5 minutes)

For each change logged at least 28 days ago, fill in the "after" columns: the 28 days since the change against the 28 days before. Keep changes that helped; revert or try again where CTR fell.

## 4. Spot new content to write (5 minutes)

On the **Queries** tab, filter by impressions with no matching page, for example cost questions or symptoms. Add promising topics to the article backlog in `docs/seo/article-review.md` ("Adding a new article"). Health content needs a dentist's review before publishing.

## Also check monthly

- **Core Web Vitals:** Search Console → *Experience → Core Web Vitals*, and Vercel → *Speed Insights*. LCP should stay under 2.5 s, INP under 200 ms and CLS under 0.1.
- **Conversions:** Vercel → *Analytics → Events* (Pro plan): `Clinic search`, `Clinic registration started/submitted`, `Booking started/requested`.
- **Clinic directory:** any clinic page left noindex (missing description, hours or services). Ask those clinics to complete Settings → Public listing and their opening hours.
