import { defineConfig, devices } from '@playwright/test';

/** Renders public/og/*.png from src/seo/ogCards.ts; see tests/og/og-cards.spec.ts. */
export default defineConfig({
  testDir: './og',
  testMatch: 'og-cards.spec.ts',
  reporter: 'line',
  use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
});
