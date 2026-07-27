import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(Deno.env.get('CI'));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    // Caret range, same rationale as scripts/deno-tool.ts: the specifier must
    // match package.json's "vite": "^8.1.5" entry in deno.lock; --frozen plus
    // the lock pin the exact resolution, so reproducibility is unchanged.
    command:
      'deno run --frozen --node-modules-dir=auto --allow-read --allow-write=. --allow-env --allow-net --allow-sys --allow-ffi=. npm:vite@^8.1.5 --host 0.0.0.0',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
  },
});
