import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from '../../src/serviceWorkerRegistration';

describe('service worker first-visit registration', () => {
  let load: EventListener;
  let onControl: () => void;
  let onResources: (list: PerformanceObserverEntryList) => void;
  let entries: PerformanceEntry[];
  let controller: { postMessage: ReturnType<typeof vi.fn> };
  let registration: {
    addEventListener: ReturnType<typeof vi.fn>;
    installing: { state: string; addEventListener: ReturnType<typeof vi.fn> } | null;
  };
  let serviceWorker: {
    controller: typeof controller | null;
    register: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
  };
  let getEntriesByType: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;

  const resource = (name: string, startTime = 1): PerformanceEntry =>
    ({ name, startTime }) as PerformanceEntry;

  const start = async (config?: Parameters<typeof register>[0]): Promise<void> => {
    register(config);
    load(new Event('load'));
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    vi.stubEnv('PROD', true);
    entries = [];
    controller = { postMessage: vi.fn() };
    registration = { addEventListener: vi.fn(), installing: null };
    serviceWorker = {
      controller: null,
      register: vi.fn().mockResolvedValue(registration),
      addEventListener: vi.fn((type: string, callback: () => void) => {
        if (type === 'controllerchange') onControl = callback;
      }),
    };
    vi.stubGlobal('navigator', { serviceWorker });
    getEntriesByType = vi.fn(() => entries);
    vi.stubGlobal('performance', { now: () => 100, getEntriesByType });
    disconnect = vi.fn();
    vi.stubGlobal(
      'PerformanceObserver',
      class {
        constructor(callback: (list: PerformanceObserverEntryList) => void) {
          onResources = callback;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      if (type === 'load') load = listener as EventListener;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('takes its first snapshot after control, including assets loaded while claiming', async () => {
    const origin = window.location.origin;
    entries = [resource(`${origin}/assets/initial-Ab12Cd34.js`)];
    await start();
    expect(getEntriesByType).not.toHaveBeenCalled();
    expect(controller.postMessage).not.toHaveBeenCalled();

    entries.push(
      resource(`${origin}/assets/claim-race-Ab12Cd34.css`),
      resource(`${origin}/assets/not-code.png`),
      resource(`${origin}/assets/token-Ab12Cd34.js?secret=1`),
      resource(`${origin}/auth/private.js`),
      resource('https://other.example/assets/foreign.js'),
    );
    serviceWorker.controller = controller;
    onControl();
    expect(controller.postMessage).toHaveBeenCalledWith({
      type: 'CACHE_LOADED_ASSETS',
      urls: [`${origin}/assets/initial-Ab12Cd34.js`, `${origin}/assets/claim-race-Ab12Cd34.css`],
    });

    onResources({
      getEntries: () => [
        resource(`${origin}/assets/late-Ab12Cd34.js`, 99),
        resource(`${origin}/assets/after-control-Ab12Cd34.js`, 101),
      ],
    } as PerformanceObserverEntryList);
    expect(controller.postMessage).toHaveBeenLastCalledWith({
      type: 'CACHE_LOADED_ASSETS',
      urls: [`${origin}/assets/late-Ab12Cd34.js`],
    });
  });

  it('snapshots an already-controlled client and repeats after a worker update', async () => {
    const url = `${window.location.origin}/assets/app-Ab12Cd34.js`;
    entries = [resource(url)];
    serviceWorker.controller = controller;
    await start();
    expect(controller.postMessage).toHaveBeenCalledWith({
      type: 'CACHE_LOADED_ASSETS',
      urls: [url],
    });

    const updatedController = { postMessage: vi.fn() };
    serviceWorker.controller = updatedController;
    onControl();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(updatedController.postMessage).toHaveBeenCalledWith({
      type: 'CACHE_LOADED_ASSETS',
      urls: [url],
    });
  });

  it('works without PerformanceObserver and gracefully skips unavailable service workers', async () => {
    vi.stubGlobal('PerformanceObserver', undefined);
    entries = [resource(`${window.location.origin}/assets/app-Ab12Cd34.js`)];
    serviceWorker.controller = controller;
    await start();
    expect(controller.postMessage).toHaveBeenCalledTimes(1);

    vi.stubGlobal('navigator', {});
    expect(() => register()).not.toThrow();
  });

  it('still snapshots assets and retains update hooks when resource observation is unsupported', async () => {
    vi.stubGlobal(
      'PerformanceObserver',
      class {
        observe(): void {
          throw new Error('resource observation unsupported');
        }
        disconnect(): void {}
      },
    );
    const url = `${window.location.origin}/assets/app-Ab12Cd34.js`;
    entries = [resource(url)];
    serviceWorker.controller = controller;
    const onUpdate = vi.fn();
    await start({ onUpdate });

    expect(controller.postMessage).toHaveBeenCalledWith({
      type: 'CACHE_LOADED_ASSETS',
      urls: [url],
    });
    const updateFound = registration.addEventListener.mock.calls.find(([type]) =>
      type === 'updatefound'
    )?.[1] as () => void;
    registration.installing = {
      state: 'installed',
      addEventListener: vi.fn((_type: string, callback: () => void) => callback()),
    };
    updateFound();
    expect(onUpdate).toHaveBeenCalledWith(registration);
  });

  it('retains the first-install callback without taking a pre-control snapshot', async () => {
    const onSuccess = vi.fn();
    await start({ onSuccess });
    const updateFound = registration.addEventListener.mock.calls.find(([type]) =>
      type === 'updatefound'
    )?.[1] as () => void;
    registration.installing = {
      state: 'installed',
      addEventListener: vi.fn((_type: string, callback: () => void) => callback()),
    };
    updateFound();
    expect(onSuccess).toHaveBeenCalledWith(registration);
    expect(getEntriesByType).not.toHaveBeenCalled();
  });
});
