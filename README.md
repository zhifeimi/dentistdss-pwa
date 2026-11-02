# DentistDSS PWA

DentistDSS is a React progressive web application for dental health education, AI-assisted guidance, clinic discovery, appointment booking, and role-based clinic workflows. It is the frontend for the [DentistDSS Spring Boot microservices](../dentistdss-microservices) backend.

Production: [https://dentist.zhifei.org](https://dentist.zhifei.org) (also [https://dentist.mizhifei.press](https://dentist.mizhifei.press))

## Features

- **Public site** — dental education content, clinic search with Google Maps, a floating AI help chat, privacy policy, and terms.
- **Accounts** — email/password signup with email verification, and Google sign-in bound to a server-issued nonce.
- **Role-based dashboards** for `PATIENT`, `DENTIST`, `RECEPTIONIST`, `CLINIC_ADMIN`, and `SYSTEM_ADMIN`: appointments, schedules and availability, patient records, approvals, system settings, and AI tools such as AI Dentist and AI Summarize.
- **PWA** — installable, with a service worker that caches only public static assets.

## Toolchain

- Deno 2.9.2 or newer
- React 19 and React Router 7
- Material UI 7
- Vite 8 and Vitest 4, executed by Deno
- Playwright for browser tests

Node.js, npm, and a repository-local `node_modules` directory are not required. `package.json` remains only as Deno's npm dependency manifest; all commands, dependency locking, checks, tests, CI, and deployment are owned by Deno.

Vite and Vitest still expect Node-style package resolution internally. `scripts/deno-tool.ts` handles this boundary by copying the project to a private temporary directory, materializing packages there with Deno, running the locked tool, copying back only build or test artifacts, and deleting the temporary directory. The checkout stays `node_modules`-free.

## Getting started

Install [Deno](https://docs.deno.com/runtime/getting_started/installation/), then cache the locked dependencies:

```bash
deno --version
deno install --frozen --node-modules-dir=none
```

Start the development server at [http://localhost:3000](http://localhost:3000):

```bash
deno task dev
```

By default the app expects the backend API gateway at `http://localhost:8080`. See the backend repository for starting the databases and services locally.

### Environment variables

`.env.development` and `.env.production` hold checked-in defaults; `.env.example` documents every variable. Create an untracked `.env.local` to override them.

| Variable | Default (dev) | Purpose |
| --- | --- | --- |
| `VITE_API_HOST` | `http://localhost` | API gateway origin |
| `VITE_API_PORT` | `8080` | API gateway port |
| `VITE_API_ROOT_PATH` | _(empty)_ | Prefix before API paths |
| `VITE_API_AUTH_PATH` | `/auth` | Auth service path |
| `VITE_API_OAUTH_PATH` | `/oauth` | OAuth path |
| `VITE_API_GENAI_PATH` | `/genai` | GenAI service path |
| `VITE_GOOGLE_CLIENT_ID` | _(empty)_ | Google sign-in OAuth client ID |
| `VITE_GOOGLE_MAPS_API_KEY` | _(empty)_ | Google Maps key for clinic search |
| `VITE_SITE_URL` | `https://dentist.zhifei.org` | Canonical origin for SEO tags and the sitemap |
| `PUBLIC_CLINICS_FIXTURE` | _(unset)_ | Build only: JSON file used instead of `GET /api/public/clinics` (tests, local runs) |

Every `VITE_*` value is embedded in the public browser bundle. Never put a server-side secret in one, and restrict the Maps key by hostname and API in Google Cloud.

## Commands

```bash
deno task dev               # development server on port 3000
deno task build             # production build in build/
deno task preview           # preview the production build
deno task check             # formatting, lint, and type checking
deno task fmt               # apply formatting
deno task test              # all Vitest suites
deno task test:watch        # interactive Vitest watch mode
deno task test:coverage     # coverage report
deno task test:unit         # also: test:integration, test:components, test:utils
deno task test:e2e:install  # install Playwright browsers once
deno task test:e2e          # Playwright browser tests
deno task test:e2e:ui       # Playwright UI mode
deno task audit             # audit the lockfile for known vulnerabilities
```

Run a single test file or test name through the compatibility wrapper:

```bash
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts vitest --run tests/unit/sessionLifecycle.test.ts
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts vitest --run tests/unit/sessionLifecycle.test.ts -t "test name"
deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts playwright test tests/e2e/auth-logout.spec.ts
```

Before pushing, mirror CI:

```bash
deno install --frozen --node-modules-dir=none
deno task audit
deno task check
deno task test
deno task build
test ! -e node_modules
```

CI does not run Playwright; run `deno task test:e2e` yourself for routing, auth, or user-flow changes.

## Project structure

```text
src/
  index.tsx          # mounts auth and Google OAuth providers
  App.tsx            # theme, notifications, router, shell, snackbar
  components/        # AppShell, Auth, Dashboard, FindAClinic, Home, shared UI
  pages/             # top-level and dashboard pages
  routes/index.tsx   # public and top-level routes
  context/           # auth, dashboard, and theme providers
  hooks/             # data and UI hooks (appointments, schedule, chat, maps)
  services/          # Axios API clients, session, chatbot SSE transport
  seo/               # SEO registry, <Seo> tags, JSON-LD, sitemap and build helpers
  content/           # Learn articles (metadata + Markdown, drafts) and For clinics copy
  utils/             # dictionary, dashboard role config, date helpers
public/              # service worker, manifest, icons
scripts/             # deno-tool.ts wrapper and Vercel Deno installer
tests/               # unit, integration, components, utils (Vitest); e2e (Playwright)
```

### Adding or renaming a page

Routing is split across several registries. Check every one that applies, or the page may render in the wrong shell, be missing from navigation, or return HTTP 404 on a fresh load:

- `src/routes/index.tsx` — public and top-level routes.
- `src/seo/pages.ts` — title, description, canonical, robots rule and structured data for each public route; indexable pages also go into the sitemap. Learn articles and the For clinics pages are generated from `src/content/` (see [docs/seo/article-review.md](docs/seo/article-review.md) for adding or publishing an article).
- `src/utils/dictionary.ts` — `locations.app` lists the signed-in paths that `AppShell` renders in the dashboard shell. Every other path renders in the public shell, and unknown paths get the Not Found page.
- `src/utils/dashboard/roleConfig.tsx` — role-specific dashboard navigation, routes, and lazy-loaded components.
- `vercel.json` — `rewrites` serve the app shell for SPA routes. Any other path gets `build/404.html` with HTTP 404, so new routes must be listed. Signed-in paths also get an `X-Robots-Tag: noindex` header.

`tests/unit/seo.test.ts` fails when these registries disagree.

## SEO

- **Canonical domain**: `https://dentist.zhifei.org`. `vercel.json` sends `dentist.mizhifei.press` and `dentistdss.vercel.app` there with a permanent redirect.
- **Metadata**: `RouteSeo` (in the public layout) renders the registry entry for the current path, and React 19 hoists the tags into `<head>`. Dynamic pages render `<Seo>` themselves.
- **Prerendering**: `vite build` builds the browser bundle, then a server build of `src/entry-server.tsx`, then `src/seo/prerender.ts` renders every page in the registry to `build/<path>/index.html`, with its content, head tags and critical MUI CSS inline. Crawlers that don't run JavaScript, link previews and AI search tools read the real page. The browser still mounts with `createRoot`, replacing the static markup. The prerender also writes `build/app-shell.html` (the plain SPA shell for signed-in paths), `build/404.html` and `build/sitemap.xml`. The build fails if a page lacks a unique title, a canonical, exactly one `<h1>`, or valid JSON-LD.
- **Clinic directory** (`src/directory/`, `src/pages/Dentists/`): the build loads `GET ${VITE_API_HOST}/api/public/clinics` (or `PUBLIC_CLINICS_FIXTURE`) and prerenders `/dentists`, `/dentists/{state}`, `/dentists/{state}/{suburb}` and `/dentists/{state}/{suburb}/{clinic-slug}`. Each page carries its data as inline JSON. The build also writes `build/data/directory.json` for client-side navigation and Find a clinic's "Clinic page" links, plus redirect pages for retired clinic slugs. With an https `VITE_API_HOST`, a failed fetch fails the build, so Vercel keeps the last good deployment. With an unset or blank host (previews, CI), the build has no clinic pages; a nonempty invalid host fails the build. clinic-service calls the Vercel Deploy Hook (`VERCEL_DEPLOY_HOOK_URL`) at most once an hour when listed clinics change, so pages stay current. Indexing rules and the contract are in [docs/seo/public-clinics-api.md](docs/seo/public-clinics-api.md).
- **Build-time rendering rules**: code that runs during render (not in effects) must not need `window`, `document` or `localStorage`, and nothing imported at module scope may hold the process open. For example, the session `BroadcastChannel` is browser-only.
- `public/robots.txt` points crawlers at the sitemap. `tests/e2e/seo.production.ts` checks the built HTML (`deno run --allow-read --allow-write --allow-run scripts/deno-tool.ts playwright test --config tests/playwright.production-offline.config.ts`).

## How it talks to the backend

```text
PWA (Vercel) -> Cloudflare -> Spring Cloud API Gateway -> domain services
```

- **REST** — the shared Axios instance in `src/services/config.ts` attaches the bearer token, unwraps the backend response envelope, dispatches snackbar messages, and logs out on 401.
- **Session** — `src/services/session.ts` keeps the bearer token and XSRF token per tab, restores sessions with cookie refresh, and blocks restore after logout.
- **AI chat** — `api.chatbot.send` uses `fetch()` to stream Server-Sent Events from `/api/genai/chatbot/{agent}`. All AI provider calls happen in the backend; the browser holds no provider key.

```typescript
const response = await api.chatbot.send('help', prompt, {
  signal,
  onText: (text) => updateMessage(text),
});
```

- **Offline caching** — the service worker caches only same-origin navigations (per path, falling back to `app-shell.html` offline) and static assets. API, auth, OAuth, and GenAI requests, and any request carrying an `Authorization` header, bypass the cache so authenticated or clinical data is never stored in the browser cache. Keep this behavior when changing `public/service-worker.js`.

## Dependency updates and security

Dependencies are integrity-locked in `deno.lock`. Deno skips package versions published in the last three days (`minimumDependencyAge`) to reduce exposure to new supply-chain attacks.

Use this workflow when updating modules, including Dependabot pull requests:

```bash
deno outdated --latest
deno install --frozen=false --node-modules-dir=none
deno task audit
deno task check
deno task test
deno task build
```

Commit both the manifest change and the regenerated `deno.lock`. CI rejects stale lockfiles and confirms that no `node_modules` directory is created.

## Deployment

Vercel creates Preview deployments for pull requests and feature branches; pushes to `main` deploy to production. `vercel.json` installs a pinned Deno 2.9.2 Linux binary after verifying its SHA-256 checksum, runs `deno task build`, serves the prerendered pages from `build/` (signed-in paths get `app-shell.html`, unknown paths get `404.html` with HTTP 404), and sets security headers.

Set `VITE_API_HOST=https://api.mizhifei.press` and `VITE_GOOGLE_CLIENT_ID` in the Vercel Production environment. Point Preview deployments at a separate staging API, or leave the host empty, so previews cannot reach production data. A new production origin must also be added to the backend CORS allowlist and to the Google OAuth client's Authorized JavaScript origins.

GitHub Actions runs the dependency audit, checks, tests, production build, CodeQL analysis, and Vercel contract validation.
