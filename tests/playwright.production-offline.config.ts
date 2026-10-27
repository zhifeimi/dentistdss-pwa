import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const origin = 'http://127.0.0.1:4175';
const vite = 'deno run --frozen --node-modules-dir=auto --allow-read --allow-write=. --allow-env --allow-net --allow-sys --allow-ffi=. npm:vite@^8.1.5';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'privacy-policy.production.ts',
  timeout: 60_000,
  workers: 1,
  reporter: 'line',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: origin,
    proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1,localhost' },
    launchOptions: {
      args: [
        '--disable-background-networking',
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
      ],
    },
  },
  webServer: {
    command: `${vite} build && ${vite} preview --host 127.0.0.1 --port 4175 --strictPort`,
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    url: origin,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_API_HOST: '',
      VITE_GOOGLE_CLIENT_ID: '',
      VITE_GOOGLE_MAPS_API_KEY: '',
    },
  },
});
