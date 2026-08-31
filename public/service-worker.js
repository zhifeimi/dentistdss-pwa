const CACHE_NAME = 'dentistdss-pwa-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/images/logo.png',
  '/images/fallback.png',
];
const PRIVATE_PATH_PREFIXES = ['/api/', '/auth/', '/oauth/', '/genai/'];
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

// Hashed build assets are NOT install-precached: index.html statically
// references every eagerly-emitted image/font (dozens of MB of Learn media),
// so install-time HTML scraping forced a multi-MB first-visit download.
// They are covered by the runtime cacheFirst handler on first use instead.
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
          names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
        )
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (canCache(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) ?? (await caches.match('/offline.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

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
