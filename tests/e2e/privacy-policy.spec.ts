import { expect, test } from '@playwright/test';

const policyHeading = (page: import('@playwright/test').Page) =>
  page.getByRole('heading', { level: 1, name: 'DentistDSS Privacy Policy' });

test('privacy policy renders directly and from the homepage footer', async ({ page }) => {
  await page.goto('/terms');
  await expect(policyHeading(page)).toBeVisible();
  await expect(page.getByText('Effective date: 24 October 2026')).toBeVisible();

  await page.goto('/');
  const privacyLink = page.getByRole('link', { name: 'Privacy Policy', exact: true });
  await privacyLink.scrollIntoViewIfNeeded();
  await privacyLink.click();

  await expect(page).toHaveURL(/\/terms$/);
  await expect(policyHeading(page)).toBeVisible();
});

test('privacy navigation uses the cached app shell when the network fails', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Service-worker offline verification runs in Chromium');
  test.setTimeout(60_000);

  await page.goto('/terms');
  await expect(policyHeading(page)).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;
  });

  await page.reload();
  await expect(policyHeading(page)).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.reload();
  await expect(policyHeading(page)).toBeVisible();

  const hasAppShell = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      await cache.delete('/terms');
    }));
    return (await caches.match('/index.html')) !== undefined;
  });
  expect(hasAppShell).toBe(true);

  try {
    await context.setOffline(true);
    await page.reload();
    await expect(policyHeading(page)).toBeVisible();
    await expect(page.getByText("You're Offline")).toHaveCount(0);
  } finally {
    await context.setOffline(false);
  }
});
