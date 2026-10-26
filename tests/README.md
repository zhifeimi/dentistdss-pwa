# Tests

Vitest covers units, services, hooks, and components in jsdom. Playwright covers browser flows against the Vite dev server with mocked backend responses. Every command runs through Deno; see the [project README](../README.md) for the toolchain.

## Layout

```text
tests/
  setup.tsx       # Vitest global setup: mocks and testUtils
  tsconfig.json
  unit/           # services, session/auth transport, hooks, booking logic
  integration/    # chatbot service against mocked fetch/SSE
  components/     # React components with Testing Library
  utils/          # pure helpers: calendar, schedule, SSE, dictionary
  e2e/            # Playwright specs (*.spec.ts)
    support/      # shared Playwright helpers, e.g. mockAuthenticatedSession
```

Vitest picks up `tests/**/*.{test,spec}.*` and `src/**/*.{test,spec}.*`, excluding `tests/e2e/`. Name Vitest files `*.test.ts` or `*.test.tsx`, and Playwright files `*.spec.ts`.

## Running

```bash
deno task test              # all Vitest suites (what CI runs)
deno task test:unit         # one folder: test:unit, test:integration, test:components, test:utils
deno task test:watch        # watch mode
deno task test:coverage     # v8 coverage: text, json, and html in coverage/

deno task test:e2e:install  # once: download Playwright browsers
deno task test:e2e          # Chromium, Firefox, and WebKit
deno task test:e2e:ui       # Playwright UI mode
```

Run a single file or test through the wrapper:

```bash
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts vitest --run tests/unit/sessionLifecycle.test.ts
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts vitest --run tests/unit/sessionLifecycle.test.ts -t "test name"
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts playwright test tests/e2e/auth-logout.spec.ts --grep "test title"
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts playwright test tests/e2e --project=chromium
```

Playwright starts the dev server on `http://localhost:3000`, or reuses one that is already running when not in CI. The HTML report is written to `playwright-report/`.

CI runs only Vitest. Run Playwright locally for routing, auth, chat, or other user-flow changes.

## Global setup (`setup.tsx`)

Every Vitest file inherits these mocks. Account for them before you write a test:

- `import.meta.env` uses local API defaults and test Google keys.
- `localStorage` and `sessionStorage` are in-memory `vi.fn()` stores.
- `window.location` is a static `http://localhost:3000/` object with mocked `assign`, `replace`, and `reload`.
- `window.dispatchEvent`, `fetch`, `IntersectionObserver`, `ResizeObserver`, `matchMedia`, `scrollIntoView`, and `google.maps` are stubs.
- `react-router` is mocked: `useNavigate` returns a no-op, `useLocation` is always `/`, and `Link`/`NavLink` render plain `<a>` tags. To test real navigation, `vi.unmock('react-router')` or render a router from `react-router-dom`.
- `@mui/material/styles` is mocked with a minimal theme.
- `console.log` is silenced; `error` and `warn` still print.

`testUtils` provides `createMockUser`, `createMockAuthToken`, `createMockSSEResponse`, `createMockStreamingResponse`, `setupAuthMocks`, `clearAllMocks`, and `waitFor`.

## Patterns used here

**Mock the backend at the API boundary.** Stub `fetch` or the module in `src/services/`, not the component internals:

```typescript
vi.mock('../../src/services', () => ({
  default: { chatbot: { send: vi.fn().mockResolvedValue({ kind: 'completed', text: 'reply' }) } },
}));
```

**Pin the time zone for date logic.** Date-only API strings are local calendar dates, so run date tests on both sides of UTC. Restore the zone by name, because deleting `TZ` does not reset it on Linux:

```typescript
describe.each(['Australia/Sydney', 'America/New_York'])('in %s', (timeZone) => {
  const originalTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  beforeAll(() => { process.env.TZ = timeZone; });
  afterAll(() => { process.env.TZ = originalTimeZone; });
  // ...
});
```

**MUI multiline `TextField`.** The global `ResizeObserver` stub is not constructible. Stub it with a class in that test:

```typescript
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
```

**Playwright with a signed-in user.** No real backend or account is used. `tests/e2e/support/authenticatedSession.ts` routes the CSRF, refresh, and `/me` calls so the app restores a session for a given role:

```typescript
import { mockAuthenticatedSession } from './support/authenticatedSession';

await mockAuthenticatedSession(page, patientUser);
await page.goto('/overview');
```

**Bug fixes start red.** Add a test that fails on the current code, fix it, then watch the test pass.

## Known limitations

- Firefox may fail to launch in sandboxed environments because Playwright cannot create its profile. Use `--project=chromium --project=webkit` there.
- If WebKit chat specs are flaky with many workers, run with `--workers=4`.
