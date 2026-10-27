import { expect, test } from '@playwright/test';

const legalPages = [
  { path: '/privacy', heading: 'DentistDSS Privacy Policy' },
  { path: '/terms', heading: /Terms (?:and|&) Conditions/i },
] as const;

test.beforeEach(async ({ page, baseURL }) => {
  const appOrigin = new URL(baseURL ?? 'http://localhost:3000').origin;
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== appOrigin || /^\/(?:api|auth|oauth2?|genai)(?:\/|$)/.test(url.pathname)) {
      return route.abort();
    }
    return route.continue();
  });
});

test('privacy and terms render as separate public pages', async ({ page }) => {
  for (const legalPage of legalPages) {
    await page.goto(legalPage.path);
    await expect(page).toHaveURL(new RegExp(`${legalPage.path}$`));
    await expect(page.getByRole('heading', { level: 1, name: legalPage.heading })).toBeVisible();
    if (legalPage.path === '/privacy') {
      await expect(page.getByRole('heading', { name: legalPages[1].heading })).toHaveCount(0);
    }
  }

  await expect(page.getByRole('heading', { name: 'DentistDSS Privacy Policy' })).toHaveCount(0);
});

test('homepage footer links to the separate privacy and terms pages', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  const privacyLink = footer.getByRole('link', { name: 'Privacy Policy', exact: true });
  const termsLink = footer.getByRole('link', { name: /Terms (?:and|&) Conditions/i });

  await expect(privacyLink).toHaveAttribute('href', '/privacy');
  await expect(termsLink).toHaveAttribute('href', '/terms');
  await privacyLink.click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: legalPages[0].heading })).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: /Terms (?:and|&) Conditions/i }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole('heading', { level: 1, name: legalPages[1].heading })).toBeVisible();
});

for (const fragment of ['google-user-data', 'google-user-data-heading']) {
  test(`legacy privacy fragment #${fragment} redirects and scrolls`, async ({ page }) => {
    await page.goto(`/terms?source=legacy&next=%2Fdashboard#${fragment}`);

    await expect(page).toHaveURL(new RegExp(`/privacy\\?source=legacy&next=%2Fdashboard#${fragment}$`));
    await expect(page.getByRole('heading', { level: 1, name: legalPages[0].heading })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(page.locator(`[id="${fragment}"]`)).toBeInViewport();
    await expect(page.getByRole('banner')).toHaveCSS('position', 'fixed');
    const headingId = fragment.endsWith('-heading') ? fragment : `${fragment}-heading`;
    await expect.poll(() => page.evaluate((id) => {
      const header = document.querySelector('header');
      const heading = document.getElementById(id);
      if (!header || !heading) return Number.NEGATIVE_INFINITY;
      const headingBounds = heading.getBoundingClientRect();
      return Math.min(
        headingBounds.top - header.getBoundingClientRect().bottom,
        window.innerHeight - headingBounds.bottom,
      );
    }, headingId)).toBeGreaterThanOrEqual(0);
  });
}

for (const fragment of ['terms-heading', 'unknown-section']) {
  test(`non-privacy fragment #${fragment} stays on terms`, async ({ page }) => {
    await page.goto(`/terms?source=legacy#${fragment}`);

    await expect(page).toHaveURL(new RegExp(`/terms\\?source=legacy#${fragment}$`));
    await expect(page.getByRole('heading', { level: 1, name: legalPages[1].heading })).toBeVisible();
  });
}

for (const legalPage of legalPages) {
  test(`${legalPage.path} works offline after an online visit`, async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Service-worker offline verification runs in Chromium');
    test.setTimeout(60_000);

    await page.goto(legalPage.path);
    await expect(page.getByRole('heading', { level: 1, name: legalPage.heading })).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;
    });

    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: legalPage.heading })).toBeVisible();

    const hasAppShell = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        await cache.delete('/privacy');
        await cache.delete('/terms');
      }));
      return (await caches.match('/index.html')) !== undefined;
    });
    expect(hasAppShell).toBe(true);

    try {
      await context.setOffline(true);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: legalPage.heading })).toBeVisible();
      await expect(page.getByText("You're Offline")).toHaveCount(0);
    } finally {
      await context.setOffline(false);
    }
  });
}
