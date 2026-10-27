interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

function cacheLoadedAssets(entries: PerformanceEntry[]): void {
  const controller = navigator.serviceWorker.controller;
  if (!controller) return;

  const urls = entries.map((entry) => entry.name).filter((name) => {
    try {
      const url = new URL(name);
      return url.origin === window.location.origin && !url.username && !url.password &&
        !url.href.includes('?') && !url.href.includes('#') &&
        /^\/assets\/(?:[\w.-]+\/)*[\w.-]+-[\w-]{8}\.(?:js|css)$/.test(url.pathname);
    } catch {
      return false;
    }
  });
  if (urls.length) {
    controller.postMessage({ type: 'CACHE_LOADED_ASSETS', urls: [...new Set(urls)] });
  }
}

export function register(config: ServiceWorkerConfig = {}): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        let observer: PerformanceObserver | undefined;
        const onControllerChange = () => {
          if (!navigator.serviceWorker.controller) return;
          const controlledAt = performance.now();
          observer?.disconnect();
          if (typeof PerformanceObserver !== 'undefined') {
            try {
              observer = new PerformanceObserver((list) => {
                cacheLoadedAssets(
                  list.getEntries().filter((entry) => entry.startTime <= controlledAt),
                );
              });
              observer.observe({ entryTypes: ['resource'] });
            } catch {
              observer = undefined;
            }
          }
          cacheLoadedAssets(performance.getEntriesByType('resource'));
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        onControllerChange();

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state !== 'installed') return;
            if (navigator.serviceWorker.controller) {
              config.onUpdate?.(registration);
            } else {
              config.onSuccess?.(registration);
            }
          });
        });
      })
      .catch((error: unknown) => {
        console.error('Service worker registration failed:', error);
      });
  });
}
