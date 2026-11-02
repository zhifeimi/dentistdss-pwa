import { expect, test } from '@playwright/test';

test('a failed clinic search says so and can be retried', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ status: 204, headers: { 'x-xsrf-token': 'e2e-xsrf-token' } }));
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Authentication required' }) }));
  let searchUp = false;
  await page.route('**/api/clinic/search', (route) =>
    searchUp
      ? route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'ok', dataObject: [{ id: 7, name: 'Harbour Dental', address: '1 Quay St', city: 'Sydney' }] }),
      })
      : route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unavailable' }) }));

  await page.goto('/find-a-clinic?q=Sydney');

  await expect(page.getByText("Couldn't search clinics")).toBeVisible();
  await expect(page.getByText('No clinics match that search')).toHaveCount(0);

  searchUp = true;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('link', { name: 'Book a visit' }).first()).toBeVisible();
});

test('a later search retries failed public-directory links', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ status: 204, headers: { 'x-xsrf-token': 'e2e-xsrf-token' } }));
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Authentication required' }) }));
  await page.route('**/api/clinic/search', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'ok',
      dataObject: [{ id: 7, slug: 'harbour-dental', name: 'Harbour Dental', address: '1 Quay St', city: 'Sydney' }],
    }),
  }));

  let directoryUp = false;
  let directoryRequests = 0;
  await page.route('**/api/public/clinics', (route) => {
    directoryRequests += 1;
    if (!directoryUp) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false }) });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        generatedAt: '2026-11-02T00:00:00Z',
        clinics: [{
          slug: 'harbour-dental',
          previousSlugs: [],
          name: 'Harbour Dental',
          description: null,
          address: { street: '1 Quay St', suburb: 'Sydney', state: 'NSW', postcode: '2000', country: 'AU' },
          location: null,
          phone: null,
          website: null,
          operatingHours: [],
          services: [],
          acceptsOnlineBooking: true,
          updatedAt: null,
        }],
      }),
    });
  });

  await page.goto('/find-a-clinic?q=Sydney');
  await expect(page.getByRole('link', { name: 'Book a visit' })).toBeVisible();
  await expect.poll(() => directoryRequests).toBe(1);
  await expect(page.getByRole('link', { name: 'Clinic page' })).toHaveCount(0);

  directoryUp = true;
  await page.getByRole('button', { name: 'Search for clinics', exact: true }).click();

  await expect(page.getByRole('link', { name: 'Clinic page' })).toBeVisible();
  await expect.poll(() => directoryRequests).toBe(2);
});
