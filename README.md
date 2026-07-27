# Dentabot

Dentabot is a React progressive web application for dental health education, AI-assisted guidance, clinic discovery, appointments, and role-based clinic workflows.

Production: [https://dentist.mizhifei.press/](https://dentist.mizhifei.press/)

## Toolchain

- Deno 2.9.2 or newer
- React 19 and React Router 7
- Material UI 7
- Vite 8 and Vitest 4, executed by Deno
- Playwright for browser tests

Node.js, npm, and a repository-local `node_modules` directory are not required. `package.json` remains only as Deno's supported npm dependency manifest; all commands, dependency locking, checks, tests, CI, and deployment are owned by Deno.

Vite and Vitest still expect Node-style package resolution internally. `scripts/deno-tool.ts` handles this compatibility boundary by copying the project to a private operating-system temporary directory, materializing packages there with Deno, running the locked tool, copying back only build or test artifacts, and deleting the temporary directory. The checkout remains `node_modules`-free.

## Getting started

Install [Deno](https://docs.deno.com/runtime/getting_started/installation/), then verify and cache the locked dependencies:

```bash
deno --version
deno install --frozen --node-modules-dir=none
```

Create a local environment file from `.env.example` if the app needs non-default API or Google integration settings. Frontend environment variables are public at build time; never place private API keys in a `VITE_*` variable.

Start the development server at [http://localhost:3000](http://localhost:3000):

```bash
deno task dev
```

## Commands

```bash
deno task check             # formatting, lint, and type checking
deno task test              # all unit, integration, component, and utility tests
deno task test:watch        # interactive Vitest watch mode
deno task test:coverage     # coverage report
deno task test:e2e:install  # install Playwright browsers once
deno task test:e2e          # browser tests
deno task build             # production build in build/
deno task preview           # preview the production build
deno task audit             # audit the Deno lockfile for known vulnerabilities
```

## Dependency updates and security

Dependencies are integrity-locked in `deno.lock`. Deno is configured to avoid package versions published in the previous three days, reducing exposure to newly published supply-chain attacks.

Use this workflow when updating modules, including Dependabot pull requests:

```bash
deno outdated --latest
deno install --frozen=false --node-modules-dir=none
deno task audit
deno task check
deno task test
deno task build
```

Commit both the dependency manifest change and the regenerated `deno.lock`. CI rejects stale lockfiles and confirms that no repository `node_modules` directory is created.

The service worker caches only same-origin navigation and static assets. Requests to API, authentication, OAuth, and generative-AI paths, as well as requests carrying an `Authorization` header, bypass the cache.

## Backend-only AI integration

All OpenAI communication is handled by the Spring AI backend. The browser receives streamed responses from authenticated backend endpoints and does not contain an OpenAI API key.

```typescript
const response = await api.chatbot.help(
  'What are your clinic hours?',
  onStreamCallback,
);

const clinicalResponse = await api.chatbot.aidentist(
  'Patient symptoms...',
  onStreamCallback,
);
```

## Deployment

Vercel Preview deployments are created for pull requests and feature branches; `main` creates production. `vercel.json` installs a pinned Deno 2.9.2 Linux binary after verifying its SHA-256 checksum, then runs `deno task build`.

Set `VITE_API_HOST=https://api.mizhifei.press` in the Vercel Production environment. Preview deployments should use a branch-scoped API host only when a separate staging backend is available.

GitHub Actions runs the Deno dependency audit, checks, tests, production build, CodeQL analysis, and Vercel contract validation.
