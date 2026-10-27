const CACHE_NAME = 'dentistdss-pwa-v5';
const LOADED_ASSETS_CACHE_NAME = `${CACHE_NAME}-loaded-assets`;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/logo192.png',
  '/logo512.png',
  '/images/logo.png',
  '/images/fallback.png',
];
const PRIVATE_PATH_PREFIXES = ['/api/', '/auth/', '/oauth/', '/oauth2/', '/genai/'];
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

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (canCache(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch {
    return (await caches.match('/index.html')) ??
      (await caches.match(request)) ??
      (await caches.match('/')) ??
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
