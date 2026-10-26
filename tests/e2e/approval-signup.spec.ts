import { expect, type Page, test } from '@playwright/test';

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const ok = json({ success: true, message: 'ok', dataObject: null });

async function mockSignupApi(page: Page): Promise<void> {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ status: 204, headers: { 'x-xsrf-token': 'e2e-xsrf-token' } }));
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Authentication required' }) }));
  await page.route('**/api/clinic/list/all', (route) =>
    route.fulfill(json({ success: true, message: 'ok', dataObject: [{ id: 7, name: 'Harbour Dental', address: '1 Quay St', city: 'Sydney' }] })));
  await page.route('**/api/auth/signup/clinic/staff', (route) => route.fulfill(ok));
  await page.route('**/api/auth/signup/clinic/admin', (route) => route.fulfill(ok));
  await page.route('**/api/auth/signup/verify/code', (route) => route.fulfill(ok));
}

async function fillAccount(page: Page): Promise<void> {
  await page.locator('input[name="firstName"]').fill('Sam');
  await page.locator('input[name="lastName"]').fill('Lee');
  await page.locator('input[name="email"]').fill('sam@harbour.com.au');
  await page.locator('input[name="password"]').fill('CorrectHorse1!');
  await page.locator('input[name="confirmPassword"]').fill('CorrectHorse1!');
}

// The backend refuses their login until approval, so verifying must not send them to log in
async function verifyEmail(page: Page): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  await expect(page).toHaveURL(/\/verify-email-code$/);
  await page.locator('input[name="verificationCode"]').fill('123456');
  await page.locator('input[name="newPassword"]').fill('CorrectHorse1!');
  await page.locator('input[name="confirmPassword"]').fill('CorrectHorse1!');
  await page.getByRole('button', { name: 'Verify email', exact: true }).click();
  await expect(page).toHaveURL(/\/pending-approval$/);
}

test('clinic staff wait for their clinic admin after verifying their email', async ({ page }) => {
  await mockSignupApi(page);
  await page.goto('/signup/clinic-staff');

  await fillAccount(page);
  await page.getByRole('radio', { name: 'Receptionist' }).check();
  await page.getByRole('combobox', { name: 'Clinic' }).click();
  await page.getByRole('option', { name: 'Harbour Dental' }).click();
  await page.getByRole('button', { name: 'Request access' }).click();

  await verifyEmail(page);
  await expect(page.getByText('Your clinic admin reviews your account.')).toBeVisible();
});

test('a new clinic waits for the DentistDSS team after verifying its email', async ({ page }) => {
  await mockSignupApi(page);
  await page.goto('/signup/clinic-admin');

  await fillAccount(page);
  for (const [name, value] of [
    ['clinicName', 'Harbour Dental'],
    ['address', '1 Quay St'],
    ['city', 'Sydney'],
    ['state', 'NSW'],
    ['zipCode', '2000'],
    ['businessEmail', 'hello@harbour.com.au'],
    ['phoneNumber', '0291234567'],
  ]) {
    await page.locator(`input[name="${name}"]`).fill(value);
  }
  await page.getByRole('combobox', { name: 'Country' }).click();
  await page.getByRole('option', { name: 'Australia' }).click();
  await page.getByRole('button', { name: 'Register clinic' }).click();

  await verifyEmail(page);
  await expect(page.getByText('The DentistDSS team reviews your clinic.')).toBeVisible();
});
