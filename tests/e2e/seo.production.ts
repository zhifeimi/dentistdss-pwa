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
    expect(html).toContain(`>${h1.replace("'", '&#x27;')}</h1>`);
    // Content is inline: no hidden segments waiting for a script to reveal them.
    expect(html).not.toMatch(/<div hidden id="S:|<template id="B:/);
    if (indexable) {
      expect(html).toContain(`<link data-seo rel="canonical" href="${SITE}${path}" />`);
    } else {
      expect(html).toContain('<meta data-seo name="robots" content="noindex, follow" />');
      expect(html).not.toContain('rel="canonical"');
    }
  });
}

test('the home page describes the site and organisation in JSON-LD', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const types = [...html.matchAll(/<script data-seo type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json)['@type']);
  expect(types).toEqual(['Organization', 'WebSite']);
});

test('the sitemap lists only indexable pages on the canonical domain', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
  expect(locs).toContain(`${SITE}/learn`);
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
