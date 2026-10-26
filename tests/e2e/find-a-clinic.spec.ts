import { expect, test } from '@playwright/test';

test('a failed clinic search says so and can be retried', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ status: 204, headers: { 'x-xsrf-token': 'e2e-xsrf-token' } }));
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Authentication required' }) }));
  let searchUp = false;
  await page.route('**/api/clinic-admin/clinics/search', (route) =>
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
