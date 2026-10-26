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

test('a visitor who books a clinic and signs up instead gets the booking back after logging in', async ({ page }) => {
  await mockLoggedOutApi(page);
  await page.route('**/api/auth/signup', (route) => route.fulfill(json({ success: true, message: 'ok', dataObject: null })));
  await page.route('**/api/auth/signup/verify/code', (route) =>
    route.fulfill(json({ success: true, message: 'ok', dataObject: null })));

  await page.goto('/appointments?book=7');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('link', { name: 'Create an account' }).click();

  await page.locator('input[name="firstName"]').fill(patient.firstName);
  await page.locator('input[name="lastName"]').fill(patient.lastName);
  await page.locator('input[name="email"]').fill(patient.email);
  await page.locator('input[name="password"]').fill('CorrectHorse1!');
  await page.locator('input[name="confirmPassword"]').fill('CorrectHorse1!');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();

  await expect(page).toHaveURL(/\/verify-email-code$/);
  await page.locator('input[name="verificationCode"]').fill('123456');
  await page.locator('input[name="newPassword"]').fill('CorrectHorse1!');
  await page.locator('input[name="confirmPassword"]').fill('CorrectHorse1!');
  await page.getByRole('button', { name: 'Verify email', exact: true }).click();

  await expect(page).toHaveURL(/\/login\?verified=true$/);
  await logIn(page);

  await expect(page).toHaveURL(/\/appointments/);
  await expect(page.getByRole('dialog').getByText('Harbour Dental').first()).toBeVisible();
});

test('after logging out, going Back does not hand the last page to the next login', async ({ page }) => {
  await mockLoggedOutApi(page);

  await page.goto('/login');
  await logIn(page);
  await expect(page).toHaveURL(/\/overview$/);
  // Two pages, so Back after logout lands on one that isn't the overview
  await page.getByRole('button', { name: 'Dental records' }).click();
  await expect(page).toHaveURL(/\/dental-records$/);
  await page.getByRole('button', { name: 'My appointments' }).click();
  await expect(page).toHaveURL(/\/appointments$/);

  await page.getByRole('button', { name: 'account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await logIn(page);
  await expect(page).toHaveURL(/\/overview$/);
});

test('after logging out, booking a clinic still comes back after logging in', async ({ page }) => {
  await mockLoggedOutApi(page);
  await page.route('**/api/clinic-admin/clinics/search', (route) =>
    route.fulfill(json({ success: true, message: 'ok', dataObject: [{ id: 7, name: 'Harbour Dental', address: '1 Quay St', city: 'Sydney' }] })));

  await page.goto('/login');
  await logIn(page);
  await page.getByRole('button', { name: 'account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole('banner').getByRole('link', { name: 'Find a clinic' }).click();
  await page.getByRole('searchbox', { name: 'Search for dental clinics' }).fill('Sydney');
  await page.getByRole('link', { name: 'Book a visit' }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await logIn(page);
  await expect(page).toHaveURL(/\/appointments/);
  await expect(page.getByRole('dialog').getByText('Harbour Dental').first()).toBeVisible();
});

test('the pending-approval page is public', async ({ page }) => {
  await page.goto('/pending-approval');

  await expect(page.getByRole('heading', { name: 'Waiting for approval' })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
});

test('booking a clinic still opens the booking when the clinic list fails, with a retry', async ({ page }) => {
  await mockLoggedOutApi(page);
  let clinicsUp = false;
  await page.route('**/api/clinic/list/all', (route) =>
    clinicsUp
      ? route.fulfill(json({ success: true, message: 'ok', dataObject: [{ id: 7, name: 'Harbour Dental', address: '1 Quay St', city: 'Sydney' }] }))
      : route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unavailable' }) }));

  await page.goto('/appointments?book=7');
  await logIn(page);

  const booking = page.getByRole('dialog');
  await expect(booking.getByText("Couldn't load clinics")).toBeVisible();

  clinicsUp = true;
  await booking.getByRole('button', { name: 'Retry' }).click();
  await expect(booking.getByRole('radio', { name: /Harbour Dental/ })).toBeChecked();
});
