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
  loadedAssetsCache: MockCache;
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
  const loadedAssetsCache: MockCache = {
    addAll: vi.fn(async () => undefined),
    add: vi.fn(async () => undefined),
    put: vi.fn(async () => undefined),
    match: vi.fn(async () => undefined),
  };
  const harness: SwHarness = {
    handlers,
    cache,
    loadedAssetsCache,
    fetchMock: vi.fn(async () => basicResponse('ok', { status: 200 })),
    caches: {
      open: vi.fn(async (name: string) =>
        name.endsWith('-loaded-assets') ? loadedAssetsCache : cache
      ),
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
const navigationRequest = (url: string, init?: RequestInit): Request => {
  const request = new Request(url, init);
  Object.defineProperty(request, 'mode', { value: 'navigate' });
  return request;
};

describe('service worker caching policy', () => {
  let sw: SwHarness;

  beforeEach(() => {
    sw = createSwScope();
  });

  it('installs listeners for install, activate, fetch, and messages', () => {
    expect(Object.keys(sw.handlers).sort()).toEqual(['activate', 'fetch', 'install', 'message']);
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

  describe('first-visit asset caching', () => {
    const dispatch = (urls: unknown[]): Promise<unknown> => {
      let result: Promise<unknown> | undefined;
      sw.handlers.message({
        data: { type: 'CACHE_LOADED_ASSETS', urls },
        waitUntil: (promise: Promise<unknown>) => {
          result = promise;
        },
      });
      expect(result).toBeDefined();
      return result!;
    };

    it('fetches visited scripts and styles without credentials and waits for cache writes', async () => {
      const finishWrites: Array<() => void> = [];
      sw.loadedAssetsCache.put.mockImplementation(() =>
        new Promise<void>((resolve) => {
          finishWrites.push(resolve);
        })
      );
      const result = dispatch([
        `${ORIGIN}/assets/app-Ab12Cd34.js`,
        `${ORIGIN}/assets/app-Ab12Cd34.css`,
      ]);
      await flush();

      expect(sw.fetchMock).toHaveBeenCalledTimes(2);
      for (const [request] of sw.fetchMock.mock.calls as unknown as Array<[Request]>) {
        expect(request.credentials).toBe('omit');
        expect(request.cache).toBe('no-store');
        expect(request.redirect).toBe('error');
        expect(request.headers.has('authorization')).toBe(false);
      }
      let finished = false;
      result.then(() => finished = true);
      await flush();
      expect(finished).toBe(false);
      expect(sw.loadedAssetsCache.put).toHaveBeenCalledTimes(2);
      finishWrites.forEach((finish) => finish());
      await result;
      expect(finished).toBe(true);
    });

    it('rejects private, foreign, credentialed, queried, fragmented, and non-code inputs', async () => {
      await dispatch([
        `${ORIGIN}/api/data-Ab12Cd34.js`,
        `${ORIGIN}/auth/data-Ab12Cd34.js`,
        `${ORIGIN}/oauth2/data-Ab12Cd34.js`,
        `${ORIGIN}/genai/data-Ab12Cd34.js`,
        `${ORIGIN}/assets/../auth/data-Ab12Cd34.js`,
        'https://foreign.example/assets/app-Ab12Cd34.js',
        'https://user:password@app.example.com/assets/app-Ab12Cd34.js',
        `${ORIGIN}/assets/app-Ab12Cd34.js?token=private`,
        `${ORIGIN}/assets/app-Ab12Cd34.js?`,
        `${ORIGIN}/assets/app-Ab12Cd34.js#section`,
        `${ORIGIN}/assets/app-Ab12Cd34.js#`,
        `${ORIGIN}/assets/app.js`,
        `${ORIGIN}/assets/photo-Ab12Cd34.png`,
        `${ORIGIN}/assets/font-Ab12Cd34.woff2`,
        new Request(`${ORIGIN}/assets/private-Ab12Cd34.js`, {
          headers: { Authorization: 'Bearer x' },
        }),
        '/assets/relative.js',
        'not a URL',
        null,
      ]);
      expect(sw.fetchMock).not.toHaveBeenCalled();
      expect(sw.caches.open).not.toHaveBeenCalled();
      expect(sw.loadedAssetsCache.put).not.toHaveBeenCalled();
    });

    it.each([
      ['no-store', basicResponse('private', { headers: { 'Cache-Control': 'private, no-store' } })],
      ['non-OK', basicResponse('missing', { status: 404 })],
      ['non-basic', new Response('opaque')],
      ['other Vary', basicResponse('varied', { headers: { vary: 'Origin, Cookie' } })],
    ])('does not store %s responses', async (_label, response) => {
      sw.fetchMock.mockResolvedValue(response);
      await dispatch([`${ORIGIN}/assets/app-Ab12Cd34.js`]);
      expect(sw.loadedAssetsCache.put).not.toHaveBeenCalled();
    });

    it('does not serve an unsafe prewarmed response, and uses the network if cache access fails', async () => {
      const request = new Request(`${ORIGIN}/assets/app-Ab12Cd34.js`, {
        headers: { origin: ORIGIN },
      });
      Object.defineProperty(request, 'destination', { value: 'script' });
      sw.loadedAssetsCache.match.mockResolvedValue(
        basicResponse('private', { headers: { vary: 'Origin', 'cache-control': 'no-store' } }),
      );
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });
      expect(await (await respondWith.mock.calls[0][0] as Response).text()).toBe('ok');
      expect(sw.fetchMock).toHaveBeenCalledTimes(1);

      sw.caches.open.mockRejectedValueOnce(new Error('cache unavailable'));
      const secondResponse = vi.fn();
      sw.handlers.fetch({ request, respondWith: secondResponse });
      expect(await (await secondResponse.mock.calls[0][0] as Response).text()).toBe('ok');
      expect(sw.fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not refetch assets already in the cache', async () => {
      sw.loadedAssetsCache.match.mockResolvedValue(basicResponse('cached'));
      await dispatch([`${ORIGIN}/assets/app-Ab12Cd34.js`]);
      expect(sw.fetchMock).not.toHaveBeenCalled();
      expect(sw.loadedAssetsCache.put).not.toHaveBeenCalled();
    });

    it('ignores malformed messages and tolerates failed or redirected fetches', async () => {
      const waitUntil = vi.fn();
      for (const data of [null, {}, { type: 'CACHE_LOADED_ASSETS', urls: 'not an array' }]) {
        sw.handlers.message({ data, waitUntil });
      }
      expect(waitUntil).not.toHaveBeenCalled();

      sw.fetchMock.mockRejectedValue(new TypeError('redirect or network error'));
      await expect(dispatch([`${ORIGIN}/assets/app-Ab12Cd34.js`])).resolves.toBeUndefined();
      expect(sw.loadedAssetsCache.put).not.toHaveBeenCalled();
    });

    it.each([['script', 'js'], ['style', 'css']])(
      'matches a prewarmed Origin variant for a same-origin hashed %s',
      async (destination, extension) => {
        const response = basicResponse('prewarmed', { headers: { vary: 'Origin' } });
        sw.loadedAssetsCache.match.mockResolvedValue(response);
        const request = new Request(`${ORIGIN}/assets/app-Ab12Cd34.${extension}`, {
          headers: { origin: ORIGIN },
        });
        Object.defineProperty(request, 'destination', { value: destination });
        const respondWith = vi.fn();
        sw.handlers.fetch({ request, respondWith });
        expect(await respondWith.mock.calls[0][0]).toBe(response);
        expect(sw.loadedAssetsCache.match).toHaveBeenCalledWith(request, { ignoreVary: true });
        expect(sw.fetchMock).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['other Vary', `${ORIGIN}/assets/app-Ab12Cd34.js`, ORIGIN, 'script', 'Origin, Cookie'],
      ['Vary Cookie', `${ORIGIN}/assets/app-Ab12Cd34.js`, ORIGIN, 'script', 'Cookie'],
      ['Vary wildcard', `${ORIGIN}/assets/app-Ab12Cd34.js`, ORIGIN, 'script', '*'],
      [
        'foreign Origin',
        `${ORIGIN}/assets/app-Ab12Cd34.js`,
        'https://foreign.example',
        'script',
        'Origin',
      ],
      ['unhashed asset', `${ORIGIN}/assets/app.js`, ORIGIN, 'script', 'Origin'],
      ['query string', `${ORIGIN}/assets/app-Ab12Cd34.js?x=1`, ORIGIN, 'script', 'Origin'],
      ['image', `${ORIGIN}/assets/app-Ab12Cd34.js`, ORIGIN, 'image', 'Origin'],
    ])('does not bypass Vary for %s', async (_label, url, origin, destination, vary) => {
      sw.loadedAssetsCache.match.mockResolvedValue(
        basicResponse('prewarmed', { headers: { vary } }),
      );
      const request = new Request(url, { headers: { origin } });
      Object.defineProperty(request, 'destination', { value: destination });
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });
      const response = await respondWith.mock.calls[0][0] as Response;
      expect(await response.text()).toBe('ok');
      expect(sw.fetchMock).toHaveBeenCalledTimes(1);
      if (vary === 'Origin') expect(sw.loadedAssetsCache.match).not.toHaveBeenCalled();
    });

    it.each([
      [`${ORIGIN}/auth/app-Ab12Cd34.js`, { origin: ORIGIN }],
      [`${ORIGIN}/api/app-Ab12Cd34.js`, { origin: ORIGIN }],
      ['https://foreign.example/assets/app-Ab12Cd34.js', { origin: ORIGIN }],
      [`${ORIGIN}/assets/app-Ab12Cd34.js`, { origin: ORIGIN, authorization: 'Bearer secret' }],
    ])(
      'never applies the fallback to private or authenticated request %s',
      async (url, headers) => {
        const request = new Request(url, { headers });
        Object.defineProperty(request, 'destination', { value: 'script' });
        const respondWith = vi.fn();
        sw.handlers.fetch({ request, respondWith });
        expect(respondWith).not.toHaveBeenCalled();
        expect(sw.loadedAssetsCache.match).not.toHaveBeenCalled();
        expect(sw.fetchMock).not.toHaveBeenCalled();
      },
    );
  });

  describe('fetch handler bypass (never intercepted, never cached)', () => {
    const oauth2NonceAssetRequest = new Request(`${ORIGIN}/oauth2/nonce`);
    Object.defineProperty(oauth2NonceAssetRequest, 'destination', { value: 'script' });
    const fetchBypassCases: Array<[string, Request]> = [
      ['API path', new Request(`${ORIGIN}/api/clinics`)],
      ['API navigation', navigationRequest(`${ORIGIN}/api/clinics`)],
      ['auth path', new Request(`${ORIGIN}/auth/login`, { method: 'POST' })],
      ['auth navigation', navigationRequest(`${ORIGIN}/auth/login`)],
      ['oauth path', new Request(`${ORIGIN}/oauth2/token`)],
      ['private oauth navigation', navigationRequest(`${ORIGIN}/oauth/token`)],
      ['oauth2 nonce fetch', new Request(`${ORIGIN}/oauth2/nonce`)],
      ['oauth2 nonce navigation', navigationRequest(`${ORIGIN}/oauth2/nonce`)],
      ['oauth2 nonce asset request', oauth2NonceAssetRequest],
      ['oauth2 token navigation', navigationRequest(`${ORIGIN}/oauth2/token`)],
      ['genai path', new Request(`${ORIGIN}/genai/chatbot/help`)],
      ['genai navigation', navigationRequest(`${ORIGIN}/genai/chatbot/help`)],
      ['cross-origin request', new Request('https://api.example.com/api/anything')],
      [
        'same-origin request carrying an Authorization header',
        new Request(`${ORIGIN}/assets/logo.png`, { headers: { Authorization: 'Bearer x' } }),
      ],
      [
        'navigation carrying an Authorization header',
        navigationRequest(`${ORIGIN}/dashboard`, { headers: { Authorization: 'Bearer x' } }),
      ],
      ['non-GET request', new Request(`${ORIGIN}/manifest.webmanifest`, { method: 'POST' })],
    ];

    it.each(fetchBypassCases)('%s', async (_label, request) => {
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });
      await flush();
      expect(respondWith).not.toHaveBeenCalled();
      expect(sw.fetchMock).not.toHaveBeenCalled();
      expect(sw.caches.open).not.toHaveBeenCalled();
      expect(sw.caches.match).not.toHaveBeenCalled();
      expect(sw.cache.put).not.toHaveBeenCalled();
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
      // Navigations are network-first: the application shell is stored for offline use.
      expect(sw.cache.put).toHaveBeenCalledTimes(1);
      expect(sw.cache.put).toHaveBeenCalledWith('/index.html', expect.any(Response));
    });

    it.each(['/privacy', '/terms'])(
      'uses the cached app shell for a failed %s navigation before offline.html',
      async (path) => {
        sw.fetchMock.mockRejectedValue(new Error('offline'));
        const appShell = new Response('<div id="root"></div>', { status: 200 });
        const offline = new Response('<h1>offline</h1>', { status: 200 });
        sw.caches.match.mockImplementation(async (key: Request | string) => {
          if (key === '/index.html') return appShell;
          if (key === '/offline.html') return offline;
          return undefined;
        });

        const request = navigationRequest(`${ORIGIN}${path}`);
        const respondWith = vi.fn();
        sw.handlers.fetch({ request, respondWith });

        const response = await respondWith.mock.calls[0][0] as Response;
        expect(await response.text()).toContain('<div id="root"></div>');
        expect(sw.caches.match).toHaveBeenCalledWith('/index.html');
        expect(sw.caches.match).not.toHaveBeenCalledWith('/offline.html');
        expect(sw.cache.put).not.toHaveBeenCalled();
      },
    );

    it('falls back to offline.html for navigations when network and cache miss', async () => {
      sw.fetchMock.mockRejectedValue(new Error('offline'));
      const offline = new Response('<h1>offline</h1>', { status: 200 });
      sw.caches.match.mockImplementation(async (key: Request | string) =>
        key === '/offline.html' ? offline : undefined
      );

      const request = navigationRequest(`${ORIGIN}/dashboard`);
      const respondWith = vi.fn();
      sw.handlers.fetch({ request, respondWith });

      const response = await respondWith.mock.calls[0][0] as Response;
      expect(await response.text()).toContain('offline');
    });
  });
});
