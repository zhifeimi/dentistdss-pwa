import { expect, test } from '@playwright/test';

/**
 * Prerendered HTML, as crawlers that don't run JavaScript and link previews
 * receive it, and the head tags after the app takes over. Runs against the
 * production build (tests/playwright.production-offline.config.ts).
 */
const pages = [
  { path: '/', h1: 'Find a dentist and book a time that suits you', indexable: true },
  { path: '/find-a-clinic', h1: 'Find a clinic', indexable: true },
  { path: '/learn', h1: 'Learn about oral health', indexable: true },
  { path: '/learn/gum-disease', h1: 'Understanding Gum Disease: Early Signs and Prevention', indexable: true },
  { path: '/for-clinics', h1: 'Dental practice software for your whole front desk', indexable: true },
  { path: '/for-clinics/online-booking', h1: 'Online booking for dental clinics', indexable: true },
  { path: '/privacy', h1: 'DentistDSS Privacy Policy', indexable: true },
  { path: '/login', h1: 'Log in', indexable: false },
] as const;

const SITE = 'https://dentist.zhifei.org';

for (const { path, h1, indexable } of pages) {
  test(`${path} ships its content and metadata in the HTML`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html.match(/<title[\s>]/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).toContain(`>${h1.replaceAll("'", '&#x27;')}</h1>`);
    // Content is inline: no hidden segments waiting for a script to reveal them.
    expect(html).not.toMatch(/<div hidden id="S:|<template id="B:/);
    // The body font is preloaded so text renders in it straight away.
    expect(html).toMatch(/<link rel="preload" href="\/assets\/atkinson-hyperlegible-next-latin-wght-normal-[\w-]+\.woff2" as="font" type="font\/woff2" crossorigin \/>/);
    if (indexable) {
      expect(html).toContain(`<link data-seo rel="canonical" href="${SITE}${path}" />`);
    } else {
      expect(html).toContain('<meta data-seo name="robots" content="noindex, follow" />');
      expect(html).not.toContain('rel="canonical"');
    }
  });
}

test('main pages share their own card, and the card image is served', async ({ request }) => {
  const html = await (await request.get('/for-clinics')).text();
  expect(html).toContain(`<meta data-seo property="og:image" content="${SITE}/og/for-clinics.png" />`);
  const image = await request.get('/og/for-clinics.png');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/png');
});

const isGoogleMaps = (url: string) => new URL(url).hostname === 'maps.googleapis.com';

test('Find a clinic waits to load Google Maps until the map is near the screen', async ({ page }) => {
  const mapsRequests: string[] = [];
  page.on('request', (request) => {
    if (isGoogleMaps(request.url())) mapsRequests.push(request.url());
  });
  // A short window, so the map starts further below it than the 200px preload margin.
  const height = 240;
  await page.setViewportSize({ width: 390, height });
  await page.goto('/find-a-clinic');
  await expect(page.getByRole('heading', { level: 1, name: 'Find a clinic' })).toBeVisible();
  const placeholder = page.getByTestId('map-placeholder');
  expect(await placeholder.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(height + 200);
  await page.waitForLoadState('networkidle');
  expect(mapsRequests).toEqual([]);

  const mapsRequest = page.waitForRequest((request) => isGoogleMaps(request.url()));
  await placeholder.scrollIntoViewIfNeeded();
  await mapsRequest;
});

test('analytics records replacement, push and Back navigation once per pathname', async ({ page }) => {
  // Keep the real SDK queue inspectable without sending production telemetry.
  await page.route('**/_vercel/insights/script.js', (route) => route.abort());
  const pageviews = () => page.evaluate(() =>
    (window.vaq ?? []).filter(([event]) => event === 'pageview')
      .map(([, properties]) => (properties as { path: string }).path)
  );

  await page.goto('/terms?token=secret#contact-heading');
  await expect(page).toHaveURL(/\/privacy\?token=secret#contact-heading$/);
  await expect.poll(pageviews).toContain('/privacy');
  await expect(page.locator('script[src="/_vercel/insights/script.js"]'))
    .toHaveAttribute('data-disable-auto-track', '1');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Learn' }).click();
  await expect.poll(pageviews).toContain('/learn');
  await page.goBack();
  await expect(page).toHaveURL(/\/privacy\?token=secret#contact-heading$/);
  await expect.poll(async () => (await pageviews()).filter((path) => path === '/privacy').length).toBe(2);
  expect((await pageviews()).filter((path) => path === '/learn')).toHaveLength(1);
  expect((await pageviews()).every((path) => !/[?#]/.test(path))).toBe(true);
});

test('the home page describes the site and organisation in JSON-LD', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const types = [...html.matchAll(/<script data-seo type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json)['@type']);
  expect(types).toEqual(['Organization', 'WebSite']);
});

test('an article ships its full text and Article markup in the HTML', async ({ request }) => {
  const html = await (await request.get('/learn/gum-disease')).text();
  expect(html).toContain('Gum disease, or periodontal disease, is one of the most common oral health problems');
  const nodes = [...html.matchAll(/<script data-seo type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json));
  expect(nodes.find((node) => node['@type'] === 'Article')).toMatchObject({
    headline: 'Understanding Gum Disease: Early Signs and Prevention',
    datePublished: '2025-06-04',
  });
  expect(html).toContain('<meta data-seo property="og:type" content="article" />');
  // Emergency advice comes before the invitation to book or ask Dentabot.
  const urgent = html.indexOf('When to get urgent help');
  expect(urgent).toBeGreaterThan(-1);
  expect(html).toContain('Call 000 for breathing difficulty');
  expect(urgent).toBeLessThan(html.indexOf('Need to see a dentist?'));
  expect(html).toContain('>Sources</h2>');
});

test('the Learn hub links each guide to its own page', async ({ page }) => {
  await page.goto('/learn');
  const card = page.getByRole('link', { name: /Understanding Gum Disease/ });
  await expect(card).toHaveAttribute('href', '/learn/gum-disease');
  await card.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Understanding Gum Disease: Early Signs and Prevention' }))
    .toBeVisible();
  await expect(page).toHaveTitle('Gum Disease: Early Signs, Causes & Prevention | DentistDSS');
});

test('an unknown guide renders the Not Found page', async ({ page }) => {
  await page.goto('/learn/no-such-guide');
  await expect(page.getByRole('heading', { level: 1, name: "We can't find that page" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test('the sitemap lists only indexable pages on the canonical domain', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
  expect(locs).toContain(`${SITE}/learn`);
  expect(locs).toContain(`${SITE}/learn/gum-disease`);
  expect(locs).toContain(`${SITE}/for-clinics/ai-receptionist`);
  expect(locs).not.toContain(`${SITE}/login`);
  expect(locs.every((loc) => loc.startsWith(`${SITE}/`))).toBe(true);
});

test('the app keeps one set of head tags and updates them on navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto('/');
  await expect(page).toHaveTitle('Find a Dentist & Book Online in Australia | DentistDSS');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/`);
  // The static copies are dropped once React renders its own.
  await expect(page.locator('[data-seo]')).toHaveCount(0);

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Learn' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Learn about oral health' })).toBeVisible();
  await expect(page).toHaveTitle('Dental Health Guides & Oral Care Tips | DentistDSS');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/learn`);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('unknown paths render a noindex Not Found page', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1, name: "We can't find that page" })).toBeVisible();
  await expect(page).toHaveTitle('Page Not Found | DentistDSS');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test.describe('clinic directory (built from tests/fixtures/public-clinics.json)', () => {
  const CLINIC = '/dentists/nsw/north-sydney/harbourside-dental-north-sydney';
  const jsonLd = (html: string) =>
    [...html.matchAll(/<script data-seo type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map(([, json]) => JSON.parse(json));

  test('a clinic page ships its details and Dentist markup in the HTML', async ({ request }) => {
    const html = await (await request.get(CLINIC)).text();
    expect(html).toContain('>Harbourside Dental</h1>');
    expect(html).toContain('Family dental clinic two minutes from North Sydney station');
    expect(html).toContain(`<link data-seo rel="canonical" href="${SITE}${CLINIC}" />`);
    expect(jsonLd(html).find((node) => node['@type'] === 'Dentist')).toMatchObject({
      name: 'Harbourside Dental',
      address: { addressLocality: 'North Sydney', addressRegion: 'NSW', postalCode: '2060' },
    });
    expect(html).toContain('id="dentistdss-directory-page"');
  });

  test('the suburb page is indexed and lists its clinics', async ({ request }) => {
    // React separates interpolated text with <!-- --> markers.
    const html = (await (await request.get('/dentists/nsw/north-sydney')).text()).replaceAll('<!-- -->', '');
    expect(html).toContain('>Dentists in North Sydney, NSW</h1>');
    expect(html).not.toContain('name="robots"');
    for (const name of ['Berry Street Dental', 'Harbourside Dental', 'Miller Street Smiles']) expect(html).toContain(name);
  });

  test('a clinic without enough details stays out of search', async ({ request }) => {
    const html = await (await request.get('/dentists/vic/fitzroy/fitzroy-dental-fitzroy')).text();
    expect(html).toContain('<meta data-seo name="robots" content="noindex, follow" />');
  });

  test('a retired clinic URL redirects to the current page', async ({ page }) => {
    await page.goto('/dentists/nsw/north-sydney/harbourside-dental');
    await expect(page).toHaveURL(new RegExp(`${CLINIC}$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Harbourside Dental' })).toBeVisible();
  });

  test('the sitemap lists indexable directory pages only', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain(`<loc>${SITE}${CLINIC}</loc>`);
    expect(xml).toContain(`<loc>${SITE}/dentists/nsw/north-sydney</loc>`);
    expect(xml).not.toContain('/dentists/vic');
  });

  test('moves between directory pages in the app', async ({ page }) => {
    await page.goto('/dentists/nsw/north-sydney');
    await page.getByRole('link', { name: /Miller Street Smiles/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Miller Street Smiles' })).toBeVisible();
    await expect(page).toHaveTitle(/Miller Street Smiles – Dentist in North Sydney NSW/);
    await expect(page.getByRole('link', { name: 'Book online' }))
      .toHaveAttribute('href', '/appointments?book=miller-street-smiles-north-sydney');
  });

  test('Find a clinic links a search result to its clinic page', async ({ page }) => {
    await page.route('**/api/clinic/search', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: null,
        dataObject: [{
          id: 11,
          name: 'Harbourside Dental',
          address: '12 Miller Street',
          city: 'North Sydney',
          state: 'NSW',
          zipCode: '2060',
          country: 'Australia',
          phoneNumber: '+61 2 9000 0001',
          email: 'hello@harbourside.example',
          isActive: true,
          slug: 'harbourside-dental-north-sydney',
          listedPublicly: true,
        }],
      }),
    }));
    await page.goto('/find-a-clinic?q=north%20sydney');
    await expect(page.getByRole('link', { name: 'Clinic page' })).toHaveAttribute('href', CLINIC);
  });
});
