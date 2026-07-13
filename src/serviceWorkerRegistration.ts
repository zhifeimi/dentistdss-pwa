interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

export function register(config: ServiceWorkerConfig = {}): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then((registration) => {
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

export async function unregister(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}
