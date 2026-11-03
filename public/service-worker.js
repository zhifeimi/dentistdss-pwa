const CACHE_NAME = 'dentistdss-pwa-v7';
const LOADED_ASSETS_CACHE_NAME = `${CACHE_NAME}-loaded-assets`;
const CORE_ASSETS = [
  '/',
  // The SPA shell vercel.json serves for signed-in app paths. Public pages are
  // prerendered, so "/" (index.html) is the home page, not a generic shell.
  '/app-shell.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/logo192.png',
  '/logo512.png',
  '/images/logo.png',
  '/images/fallback.png',
];
// /_vercel/ serves the unhashed analytics and Speed Insights scripts and
// receives their beacons: always straight from the network, never cached.
const PRIVATE_PATH_PREFIXES = ['/api/', '/auth/', '/oauth/', '/oauth2/', '/genai/', '/_vercel/'];
const CACHEABLE_DESTINATIONS = new Set(['font', 'image', 'manifest', 'script', 'style', 'worker']);

function isPrivateRequest(request, url) {
  return request.headers.has('authorization') ||
    PRIVATE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function canCache(response) {
  return response.ok &&
    response.type === 'basic' &&
    !response.headers.get('cache-control')?.toLowerCase().includes('no-store');
}

function isLoadedAssetUrl(url) {
  return url.origin === self.location.origin && !url.username && !url.password &&
    !url.href.includes('?') && !url.href.includes('#') &&
    /^\/assets\/(?:[\w.-]+\/)*[\w.-]+-[\w-]{8}\.(?:js|css)$/.test(url.pathname);
}

// Hashed build assets are NOT install-precached: index.html statically
// references every eagerly-emitted image/font (dozens of MB of Learn media),
// so install-time HTML scraping forced a multi-MB first-visit download.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE_NAME && name !== LOADED_ASSETS_CACHE_NAME)
            .map((name) => caches.delete(name)),
        )
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheLoadedAssets(urls) {
  const requests = urls.flatMap((value) => {
    if (typeof value !== 'string') return [];
    try {
      const url = new URL(value);
      if (!isLoadedAssetUrl(url)) return [];
      return [
        new Request(url.href, {
          credentials: 'omit',
          cache: 'no-store',
          redirect: 'error',
          mode: 'same-origin',
        }),
      ];
    } catch {
      return [];
    }
  });
  if (!requests.length) return;

  const cache = await caches.open(LOADED_ASSETS_CACHE_NAME);
  await Promise.all(requests.map(async (request) => {
    try {
      if (await cache.match(request)) return;
      const response = await fetch(request);
      const vary = response.headers.get('vary')?.trim().toLowerCase();
      if (canCache(response) && (!vary || vary === 'origin')) await cache.put(request, response);
    } catch {
      return;
    }
  }));
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_LOADED_ASSETS' || !Array.isArray(event.data.urls)) return;
  event.waitUntil(cacheLoadedAssets(event.data.urls));
});

// Each page is its own prerendered document, so navigations are cached per
// path (query and hash ignored). Offline, a page never visited falls back to
// the app shell, which renders any route client-side.
async function networkFirst(request) {
  const pageKey = new URL(request.url).pathname;
  try {
    const response = await fetch(request);
    if (canCache(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(pageKey, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(pageKey)) ??
      (await caches.match('/app-shell.html')) ??
      (await caches.match('/offline.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const url = new URL(request.url);
  if (
    (request.destination === 'script' || request.destination === 'style') &&
    request.headers.get('origin') === self.location.origin && isLoadedAssetUrl(url)
  ) {
    const response = await caches.open(LOADED_ASSETS_CACHE_NAME)
      .then((loadedAssets) => loadedAssets.match(request, { ignoreVary: true }))
      .catch(() => undefined);
    if (
      response && canCache(response) &&
      response.headers.get('vary')?.trim().toLowerCase() === 'origin'
    ) {
      return response;
    }
  }

  try {
    const response = await fetch(request);
    if (canCache(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.destination === 'image') {
      return (await caches.match('/images/fallback.png')) ?? Response.error();
    }
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivateRequest(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (CACHEABLE_DESTINATIONS.has(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
