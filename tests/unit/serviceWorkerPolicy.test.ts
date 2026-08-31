import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Executes the real public/service-worker.js against a mocked ServiceWorker
 * global scope so regressions in its privacy/caching policy fail CI instead
 * of silently persisting clinical or authenticated responses in the browser.
 */

const SW_PATH = resolve(process.cwd(), 'public/service-worker.js');
const SW_SOURCE = readFileSync(SW_PATH, 'utf8');
const ORIGIN = 'https://app.example.com';

interface MockCache {
  addAll: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
}

interface SwHarness {
  handlers: Record<string, (event: unknown) => void>;
  caches: {
    open: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    match: ReturnType<typeof vi.fn>;
  };
  cache: MockCache;
  fetchMock: ReturnType<typeof vi.fn>;
}

// undici constructs Responses with type 'default'; real same-origin fetches
// in a worker yield 'basic', which the worker's canCache() gate requires.
const basicResponse = (body: string, init?: ResponseInit): Response => {
  const response = new Response(body, init);
  Object.defineProperty(response, 'type', { value: 'basic' });
  return response;
};

const createSwScope = (): SwHarness => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const cache: MockCache = {
    addAll: vi.fn(async () => undefined),
    add: vi.fn(async () => undefined),
    put: vi.fn(async () => undefined),
    match: vi.fn(async () => undefined),
  };
  const harness: SwHarness = {
    handlers,
    cache,
    fetchMock: vi.fn(async () => basicResponse('ok', { status: 200 })),
    caches: {
      open: vi.fn(async () => cache),
      keys: vi.fn(async () => [] as string[]),
      delete: vi.fn(async () => true),
      match: vi.fn(async () => undefined),
    },
  };

  const scope = {
    self: {
      addEventListener: (type: string, handler: (event: unknown) => void): void => {
        handlers[type] = handler;
      },
      location: { origin: ORIGIN },
      clients: { claim: vi.fn(async () => undefined) },
    },
    caches: harness.caches,
    fetch: harness.fetchMock,
    Request,
    Response,
    URL,
    Set,
    Promise,
  };

  // The worker is classic script: evaluating the source installs listeners on
  // the mocked `self` scope.
  new Function(...Object.keys(scope), SW_SOURCE)(...Object.values(scope));
  return harness;
};

const flush = async (): Promise<void> => {
  // networkFirst/cacheFirst chain fetch -> caches.open -> cache.put; give the
  // microtask queue several turns so `put` assertions observe completion.
  for (let i = 0; i < 8; i++) {
    await Promise.resolve();
  }
};

// undici's Request constructor rejects mode: 'navigate' (only browsers create
// those), so navigation requests get the mode stamped on afterwards.
const navigationRequest = (url: string): Request => {
  const request = new Request(url);
  Object.defineProperty(request, 'mode', { value: 'navigate' });
  return request;
};

describe('service worker caching policy', () => {
  let sw: SwHarness;

  beforeEach(() => {
    sw = createSwScope();
  });

  it('installs listeners for install, activate, and fetch', () => {
    expect(Object.keys(sw.handlers).sort()).toEqual(['activate', 'fetch', 'install']);
  });

  it('install precaches only CORE_ASSETS and never scrapes build assets from index.html', async () => {
    // index.html statically references every eagerly-emitted hashed asset
    // (images/fonts); install-time HTML scraping used to download megabytes
    // on first visit. The install handler must not read or add them.
    let installResult: Promise<void> | undefined;
    sw.handlers.install({
      waitUntil: (p: Promise<void>) => {
        installResult = p;
      },
    });

    await installResult;
    expect(sw.cache.addAll).toHaveBeenCalledTimes(1);
    const assets = sw.cache.addAll.mock.calls[0][0] as string[];
    expect(assets).toEqual(expect.arrayContaining(['/', '/index.html', '/offline.html']));
    expect(assets.every((path) => !path.startsWith('/assets/'))).toBe(true);
    // No per-asset cache.add calls and no index.html match/scrape during install.
    expect(sw.cache.add).not.toHaveBeenCalled();
    expect(sw.cache.match).not.toHaveBeenCalled();
  });

  it('activate deletes stale caches and claims clients', async () => {
    sw.caches.keys.mockResolvedValue(['dentistdss-pwa-v2', 'old-cache']);
    let activateResult: Promise<unknown> | undefined;
    sw.handlers.activate({
      waitUntil: (p: Promise<unknown>) => {
        activateResult = p;
      },
    });

    await activateResult;
    expect(sw.caches.delete).toHaveBeenCalledWith('dentistdss-pwa-v2');
    expect(sw.caches.delete).toHaveBeenCalledWith('old-cache');
  });

  describe('fetch handler bypass (never intercepted, never cached)', () => {
    const fetchBypassCases: Array<[string, Request]> = [
      ['API path', new Request(`${ORIGIN}/api/clinics`)],
      ['auth path', new Request(`${ORIGIN}/auth/login`, { method: 'POST' })],
      ['oauth path', new Request(`${ORIGIN}/oauth2/token`)],
      ['genai path', new Request(`${ORIGIN}/genai/chatbot/help`)],
      ['cross-origin request', new Request('https://api.example.com/api/anything')],
      [
        'same-origin request carrying an Authorization header',
        new Request(`${ORIGIN}/assets/logo.png`, { headers: { Authorization: 'Bearer x' } }),
      ],
      ['non-GET request', new Request(`${ORIGIN}/manifest.webmanifest`, { method: 'POST' })],
    ];

    it.each(fetchBypassCases)('%s', (_label, request) => {
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });
      expect(respondWith).not.toHaveBeenCalled();
      expect(sw.fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('fetch handler caching behavior for public assets', () => {
    it('caches same-origin public script responses (cache-first)', async () => {
      const request = new Request(`${ORIGIN}/assets/index.js`);
      Object.defineProperty(request, 'destination', { value: 'script' });
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });

      expect(respondWith).toHaveBeenCalledTimes(1);
      const response = await respondWith.mock.calls[0][0] as Response;
      expect(await response.text()).toBe('ok');
      await flush();
      expect(sw.cache.put).toHaveBeenCalledTimes(1);
    });

    it('does not cache responses marked no-store', async () => {
      sw.fetchMock.mockResolvedValue(
        basicResponse('secret', { status: 200, headers: { 'cache-control': 'no-store' } }),
      );
      const request = new Request(`${ORIGIN}/images/logo.png`);
      Object.defineProperty(request, 'destination', { value: 'image' });
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });

      await respondWith.mock.calls[0][0] as Response;
      await flush();
      expect(sw.cache.put).not.toHaveBeenCalled();
    });

    it('serves navigation network-first and does not treat navigations as cacheable assets', async () => {
      const request = navigationRequest(`${ORIGIN}/dashboard`);
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });

      await respondWith.mock.calls[0][0] as Response;
      await flush();
      expect(sw.fetchMock).toHaveBeenCalledTimes(1);
      // Navigations are network-first: the page is stored for offline use.
      expect(sw.cache.put).toHaveBeenCalledTimes(1);
    });

    it('falls back to offline.html for navigations when network and cache miss', async () => {
      sw.fetchMock.mockRejectedValue(new Error('offline'));
      const offline = new Response('<h1>offline</h1>', { status: 200 });
      sw.caches.match.mockImplementation(async (key: Request | string) =>
        key === '/offline.html' ? offline : undefined);

      const request = navigationRequest(`${ORIGIN}/dashboard`);
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });

      const response = await respondWith.mock.calls[0][0] as Response;
      expect(await response.text()).toContain('offline');
    });
  });
});
