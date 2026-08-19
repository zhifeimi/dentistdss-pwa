import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './support/authenticatedSession';

const dentistUser = {
  id: 2,
  email: 'dentist@test.com',
  firstName: 'Jane',
  lastName: 'Smith',
  roles: ['DENTIST'],
  isEmailVerified: true,
  isActive: true,
  clinicId: 1,
  clinicName: 'Test Clinic',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const patientUser = {
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

test.describe('Authenticated chat pages', () => {
  test('DENTIST streams cumulative AI Dentist text', async ({ page }) => {
    await mockAuthenticatedSession(page, dentistUser);

    let requestCount = 0;
    await page.route('**/api/genai/chatbot/aidentist', async (route) => {
      requestCount += 1;
      expect(route.request().method()).toBe('POST');
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: 'data: First\n\ndata: response\n\ndata: [DONE]\n\n',
      });
    });

    await page.goto('/ai-dentist');

    const input = page.getByPlaceholder(
      'Ask about patient symptoms, treatment options, clinical guidelines...',
    );
    await expect(input).toBeVisible();
    await input.fill('What should I consider for tooth pain?');
    await input.press('Enter');

    await expect(page.getByText('First response', { exact: true })).toBeVisible();
    expect(requestCount).toBe(1);
  });

  test('PATIENT switches from Receptionist to Triage without stale conversation text', async ({ page }) => {
    await mockAuthenticatedSession(page, patientUser);

    let releaseReceptionist!: () => void;
    const receptionistHeld = new Promise<void>((resolve) => {
      releaseReceptionist = resolve;
    });
    let receptionistCompletedResolve!: () => void;
    const receptionistCompleted = new Promise<void>((resolve) => {
      receptionistCompletedResolve = resolve;
    });

    await page.route('**/api/genai/chatbot/receptionist', async (route) => {
      await receptionistHeld;
      try {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
          body: 'data: stale\n\ndata: receptionist\n\ndata: [DONE]\n\n',
        });
      } catch (_) {
        // The page aborts this request when the user changes chat modes.
      } finally {
        receptionistCompletedResolve();
      }
    });

    let triageRequestCount = 0;
    await page.route('**/api/genai/chatbot/triage', async (route) => {
      triageRequestCount += 1;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: 'data: triage\n\ndata: response\n\ndata: [DONE]\n\n',
      });
    });

    try {
      await page.goto('/ai-receptionist');

      const receptionistInput = page.getByPlaceholder(
        'Ask about appointments, clinic services, or general information...',
      );
      await expect(receptionistInput).toBeVisible();
      const receptionistRequest = page.waitForRequest('**/api/genai/chatbot/receptionist');
      const stalePrompt = 'Keep this receptionist message out of triage';
      await receptionistInput.fill(stalePrompt);
      await receptionistInput.press('Enter');
      await receptionistRequest;
      await expect(page.getByText(stalePrompt, { exact: true })).toBeVisible();

      await page.getByRole('tab', { name: 'AI Triage' }).click();

      const triageInput = page.getByPlaceholder('Describe your symptoms or dental concerns...');
      await expect(triageInput).toBeVisible();
      await expect(page.getByText(stalePrompt, { exact: true })).not.toBeVisible();

      releaseReceptionist();
      await receptionistCompleted;

      await triageInput.fill('I have severe tooth pain');
      await triageInput.press('Enter');
      await expect(page.getByText('triage response', { exact: true })).toBeVisible();
      expect(triageRequestCount).toBe(1);
      await expect(page.getByText(stalePrompt, { exact: true })).not.toBeVisible();
      await expect(page.getByText('stale receptionist', { exact: true })).not.toBeVisible();
    } finally {
      releaseReceptionist();
    }
  });

  test('DENTIST retains the final summary and shows Save success snackbar', async ({ page }) => {
    await page.route('**/api/notification/user/*/unread-count', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          dataObject: { count: 0 },
        }),
      });
    });
    await mockAuthenticatedSession(page, dentistUser);

    let requestCount = 0;
    await page.route('**/api/genai/chatbot/documentation/summarize', async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: 'data: Summary\n\ndata: retained\n\ndata: [DONE]\n\n',
      });
    });

    await page.goto('/ai-summarize');

    const input = page.getByPlaceholder(
      'Paste appointment notes, clinical observations, or treatment details for summarization...',
    );
    await expect(input).toBeVisible();
    await input.fill('Patient reports sensitivity after a recent filling.');
    const sendButton = page.getByRole('button').filter({ has: page.getByTestId('SendIcon') });
    await sendButton.click();

    await expect(page.getByText('Summary retained', { exact: true })).toBeVisible();
    expect(requestCount).toBe(1);

    const summaryCard = page
      .getByText('Summary retained', { exact: true })
      .locator('xpath=ancestor::div[contains(@class, "MuiCard-root")]');
    const saveButton = summaryCard.getByRole('button', { name: 'Save to Records', exact: true });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Summary saved to patient records' }),
    ).toBeVisible();
  });
});
