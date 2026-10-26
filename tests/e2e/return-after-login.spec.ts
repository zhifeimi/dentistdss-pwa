import { expect, type Page, test } from '@playwright/test';

const patient = {
  id: 1,
  email: 'patient@test.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: ['PATIENT'],
  isEmailVerified: true,
  isActive: true,
  clinicId: 1,
  clinicName: 'Test Clinic',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

// Starts logged out; POST /api/auth/login signs the patient in
async function mockLoggedOutApi(page: Page): Promise<void> {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ status: 204, headers: { 'x-xsrf-token': 'e2e-xsrf-token' } }));
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Authentication required' }) }));
  await page.route('**/api/auth/login', (route) =>
    route.fulfill(json({ success: true, message: 'ok', dataObject: { accessToken: 'e2e-access-token', tokenType: 'Bearer', user: patient } })));
  await page.route('**/api/auth/me', (route) => route.fulfill(json(patient)));
  await page.route('**/api/auth/logout', (route) => route.fulfill(json({ success: true, message: 'Logged out' })));
  await page.route('**/api/appointment/patient/1', (route) => route.fulfill(json({ success: true, message: 'ok', dataObject: [] })));
  await page.route('**/api/clinic/list/all', (route) =>
    route.fulfill(json({ success: true, message: 'ok', dataObject: [{ id: 7, name: 'Harbour Dental', address: '1 Quay St', city: 'Sydney' }] })));
}

async function logIn(page: Page): Promise<void> {
  await page.locator('input[name="email"]').fill(patient.email);
  await page.locator('input[name="password"]').fill('CorrectHorse1!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

test('a logged-out visitor who books a clinic gets that booking back after logging in', async ({ page }) => {
  await mockLoggedOutApi(page);

  await page.goto('/appointments?book=7');
  await expect(page).toHaveURL(/\/login$/);

  await logIn(page);

  await expect(page).toHaveURL(/\/appointments/);
  await expect(page.getByRole('dialog').getByText('Harbour Dental').first()).toBeVisible();
});

test('logging out and back in starts from the overview, not the last page', async ({ page }) => {
  await mockLoggedOutApi(page);

  await page.goto('/appointments?book=7');
  await logIn(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await logIn(page);
  await expect(page).toHaveURL(/\/overview$/);
});

test('the pending-approval page is public', async ({ page }) => {
  await page.goto('/pending-approval');

  await expect(page.getByRole('heading', { name: 'Waiting for approval' })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
});
