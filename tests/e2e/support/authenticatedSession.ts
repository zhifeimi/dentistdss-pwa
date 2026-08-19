import { type Page } from '@playwright/test';

export interface MockUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isEmailVerified: boolean;
  isActive: boolean;
  clinicId: number;
  clinicName: string;
  createdAt: string;
  updatedAt: string;
}

export async function mockAuthenticatedSession(page: Page, user: MockUser): Promise<void> {
  // Public CSRF bootstrap consumed by the in-memory XSRF transport
  await page.route('**/api/auth/csrf', async (route) => {
    await route.fulfill({
      status: 204,
      headers: { 'x-xsrf-token': 'e2e-xsrf-token' },
    });
  });

  // Cookie-backed session restore: returns the envelope the response
  // interceptor unwraps to the SessionTokens payload
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'x-xsrf-token': 'e2e-xsrf-token' },
      body: JSON.stringify({
        success: true,
        message: 'Session refreshed',
        dataObject: {
          accessToken: 'e2e-access-token',
          tokenType: 'Bearer',
        },
      }),
    });
  });

  // Profile lookup for the restored session
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
}
