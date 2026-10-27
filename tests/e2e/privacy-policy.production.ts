import { expect, test } from '@playwright/test';

const legalPages = [
  { path: '/privacy', heading: 'DentistDSS Privacy Policy', chunk: 'PrivacyPolicy-' },
  { path: '/terms', heading: 'Terms and Conditions', chunk: 'TermsAndConditions-' },
] as const;

for (const legalPage of legalPages) {
  test(`${legalPage.path} works offline after its first production visit`, async ({ page, context, baseURL }) => {
    const appOrigin = new URL(baseURL!).origin;
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== appOrigin || /^\/(?:api|auth|oauth2?|genai)(?:\/|$)/.test(url.pathname)) {
        return route.abort();
      }
      return route.continue();
    });
    await page.addInitScript(() => {
      (window as Window & { initialServiceWorkerController?: boolean }).initialServiceWorkerController =
        Boolean(navigator.serviceWorker?.controller);
    });

    await test.step('render the first online visit', async () => {
      await page.goto(legalPage.path);
      await expect(page.getByRole('heading', { level: 1, name: legalPage.heading, exact: true })).toBeVisible();
    });
    expect(await page.evaluate(() =>
      (window as Window & { initialServiceWorkerController?: boolean }).initialServiceWorkerController
    )).toBe(false);
    await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
    expect(await page.evaluate(() => new URL(navigator.serviceWorker.controller!.scriptURL).pathname))
      .toBe('/service-worker.js');

    const { entry, assets } = await page.evaluate(() => {
      const entry = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src ?? '';
      const assets = performance.getEntriesByType('resource').map((resource) => resource.name)
        .filter((resource) => {
          const url = new URL(resource);
          return url.origin === location.origin && url.pathname.startsWith('/assets/') &&
            /\.(?:js|css)$/.test(url.pathname);
        });
      return { entry, assets: [...new Set(assets)] };
    });
    expect(entry).toBeTruthy();
    expect(assets).toContain(entry);
    const routeAssets = assets.filter((asset) => new URL(asset).pathname.includes(legalPage.chunk));
    expect(routeAssets).not.toHaveLength(0);

    await expect.poll(() => page.evaluate(async (urls) => {
      const matches = await Promise.all(urls.map((url) => caches.match(url)));
      return urls.filter((_, index) => !matches[index]);
    }, assets), { timeout: 20_000, message: 'Initial app and legal-page assets must be cached' }).toEqual([]);

    const offlineAssets = new Set<string>();
    page.on('response', (response) => {
      if (response.fromServiceWorker()) offlineAssets.add(response.url());
    });

    try {
      await context.setOffline(true);
      await test.step('render the offline reload', async () => {
        const response = await page.reload();
        expect(response?.fromServiceWorker()).toBe(true);
        await expect(page.getByRole('heading', { level: 1, name: legalPage.heading, exact: true })).toBeVisible();
      });
      await expect.poll(() => [...offlineAssets]).toContain(entry);
      await expect.poll(() => routeAssets.some((asset) => offlineAssets.has(asset))).toBe(true);
    } finally {
      await context.setOffline(false);
    }
  });
}
