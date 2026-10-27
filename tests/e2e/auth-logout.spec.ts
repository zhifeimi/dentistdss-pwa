import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './support/authenticatedSession';

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

test('logout immediately removes authenticated actions and protects the dashboard', async ({ page }) => {
  let logoutStarted = false;
  let logoutFinished = false;
  let releaseLogout!: () => void;
  const logoutGate = new Promise<void>((resolve) => {
    releaseLogout = resolve;
  });

  await mockAuthenticatedSession(page, {
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
  });
  await page.route('**/api/auth/refresh', async (route) => {
    if (!logoutStarted) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Authentication required' }),
    });
  });
  await page.route('**/api/auth/logout', async (route) => {
    logoutStarted = true;
    await logoutGate;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'User logged out successfully' }),
    });
    logoutFinished = true;
  });

  try {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/overview$/);
    await expect(page.getByRole('navigation', { name: 'dashboard navigation' })).toBeVisible();

    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => logoutStarted).toBe(true);
    expect(logoutFinished).toBe(false);

    await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { name: 'DentistDSS Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign up', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Messages', exact: true })).toHaveCount(0);

    releaseLogout();
    await expect.poll(() => logoutFinished).toBe(true);

    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'DentistDSS Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Messages', exact: true })).toHaveCount(0);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('navigation', { name: 'dashboard navigation' })).toHaveCount(0);
  } finally {
    releaseLogout();
  }
});

test('logout blocks session restore when reloading before the server responds', async ({ page }) => {
  let logoutStarted = false;
  let releaseLogout!: () => void;
  const logoutGate = new Promise<void>((resolve) => {
    releaseLogout = resolve;
  });

  await mockAuthenticatedSession(page, {
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
  });
  await page.route('**/api/auth/logout', async (route) => {
    logoutStarted = true;
    await logoutGate;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'User logged out successfully' }),
    });
  });

  try {
    await page.goto('/overview');
    await expect(page.getByRole('navigation', { name: 'dashboard navigation' })).toBeVisible();

    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => logoutStarted).toBe(true);

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('navigation', { name: 'dashboard navigation' })).toHaveCount(0);

    await page.goto('/overview');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('navigation', { name: 'dashboard navigation' })).toHaveCount(0);
  } finally {
    releaseLogout();
  }
});
