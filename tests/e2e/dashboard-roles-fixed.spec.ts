import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './support/authenticatedSession';

test.describe('Dashboard Role Fix Verification', () => {
  test('should handle PATIENT role correctly (uppercase from backend)', async ({ page }) => {
    // Mock the authentication session to return uppercase PATIENT role
    await mockAuthenticatedSession(page, {
      id: 1,
      email: 'patient@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['PATIENT'], // Backend returns uppercase
      isEmailVerified: true,
      isActive: true,
      clinicId: 1,
      clinicName: 'Test Clinic',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for navigation to complete
    await page.waitForTimeout(2000);

    // Verify that the "No dashboard roles available" error is NOT shown
    await expect(page.locator('text=No dashboard roles available for your account.')).not
      .toBeVisible();

    // Verify patient navigation sections are visible. The MUI shell renders
    // each section name more than once (AppBar title + nav drawer + content
    // heading), so assert on the first match — one occurrence proves the
    // section exists.
    await expect(page.locator('text=Overview').first()).toBeVisible();
    await expect(page.locator('text=My Appointments').first()).toBeVisible();
  });

  test('should handle DENTIST role correctly (uppercase from backend)', async ({ page }) => {
    // Mock the authentication session to return uppercase DENTIST role
    await mockAuthenticatedSession(page, {
      id: 2,
      email: 'dentist@test.com',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      roles: ['DENTIST'], // Backend returns uppercase
      isEmailVerified: true,
      isActive: true,
      clinicId: 1,
      clinicName: 'Test Clinic',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for navigation to complete
    await page.waitForTimeout(2000);

    // Verify that the "No dashboard roles available" error is NOT shown
    await expect(page.locator('text=No dashboard roles available for your account.')).not
      .toBeVisible();

    // Verify dentist navigation sections are visible (first-match: the MUI
    // shell repeats section names across AppBar, nav drawer, and content).
    await expect(page.locator('text=Overview').first()).toBeVisible();
    await expect(page.locator('text=Appointments').first()).toBeVisible();
    await expect(page.locator('text=Schedule').first()).toBeVisible();
  });

  test('should handle multiple uppercase roles correctly', async ({ page }) => {
    // Mock the authentication session to return multiple uppercase roles
    await mockAuthenticatedSession(page, {
      id: 3,
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['DENTIST', 'CLINIC_ADMIN'], // Multiple uppercase roles
      isEmailVerified: true,
      isActive: true,
      clinicId: 1,
      clinicName: 'Test Clinic',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for navigation to complete
    await page.waitForTimeout(2000);

    // Verify that the "No dashboard roles available" error is NOT shown
    await expect(page.locator('text=No dashboard roles available for your account.')).not
      .toBeVisible();

    // Verify navigation sections are visible (should show first role's sections)
    await expect(page.locator('text=Overview').first()).toBeVisible();
  });
});
