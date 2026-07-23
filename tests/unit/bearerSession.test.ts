import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDispatchEvent } from '../setup';

const axiosMocks = vi.hoisted(() => {
  const interceptors = {
    requestFulfilled: undefined as any,
    responseRejected: undefined as any,
  };
  const instance: any = vi.fn();
  instance.get = vi.fn();
  instance.post = vi.fn();
  instance.interceptors = {
    request: {
      use: (onFulfilled: any) => {
        interceptors.requestFulfilled = onFulfilled;
      },
    },
    response: {
      use: (_onFulfilled: any, onRejected: any) => {
        interceptors.responseRejected = onRejected;
      },
    },
  };
  return { instance, interceptors };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosMocks.instance),
  },
}));

import {
  clearBearerSession,
  clearXsrfToken,
  getBearerSession,
  hasBearerSession,
  redirectToLogin,
  setBearerSession,
} from '../../src/services/config';

const HOME_URL = 'http://localhost:3000/';

const terminal401 = (overrides: Record<string, unknown> = {}) => ({
  config: {
    url: '/api/appointment/list',
    method: 'get',
    headers: {},
    _retry: true,
    ...overrides,
  },
  response: { status: 401, data: {} },
});

describe('in-memory bearer session', () => {
  beforeEach(() => {
    clearBearerSession();
    clearXsrfToken();
    localStorage.clear();
    window.location.href = HOME_URL;
    window.location.pathname = '/';
  });

  it('stores, reads, and clears the bearer only in module memory', () => {
    setBearerSession('token-1', 'Bearer');

    expect(getBearerSession()).toEqual({ accessToken: 'token-1', tokenType: 'Bearer' });
    expect(hasBearerSession()).toBe(true);
    // The bearer must never be written to web storage.
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('tokenType')).toBeNull();

    clearBearerSession();

    expect(hasBearerSession()).toBe(false);
    expect(getBearerSession()).toBeUndefined();
  });

  it('ignores empty tokens and defaults the token type', () => {
    setBearerSession('', 'Bearer');
    expect(hasBearerSession()).toBe(false);

    setBearerSession('token-2');
    expect(getBearerSession()?.tokenType).toBe('Bearer');

    setBearerSession('token-3', '');
    expect(getBearerSession()).toEqual({ accessToken: 'token-3', tokenType: 'Bearer' });
  });

  it('attaches the in-memory bearer to same-origin requests', () => {
    setBearerSession('memory-token', 'Bearer');

    const request = axiosMocks.interceptors.requestFulfilled({
      url: '/api/appointment/list',
      method: 'get',
      headers: {},
    });

    expect(request.headers.Authorization).toBe('Bearer memory-token');
  });
});

describe('explicit redirect semantics', () => {
  beforeEach(() => {
    axiosMocks.instance.get.mockReset();
    axiosMocks.instance.post.mockReset();
    axiosMocks.instance.mockReset();
    clearBearerSession();
    clearXsrfToken();
    localStorage.clear();
    window.location.href = HOME_URL;
    window.location.pathname = '/';
  });

  it('redirects to login when a live session ends with a terminal 401', async () => {
    setBearerSession('live-token', 'Bearer');

    await expect(
      axiosMocks.interceptors.responseRejected(terminal401()),
    ).rejects.toBeDefined();

    expect(hasBearerSession()).toBe(false);
    expect(window.location.href).toBe('/login');
  });

  it('does not redirect an anonymous caller on a 401', async () => {
    await expect(
      axiosMocks.interceptors.responseRejected(terminal401()),
    ).rejects.toBeDefined();

    expect(hasBearerSession()).toBe(false);
    expect(window.location.href).toBe(HOME_URL);
  });

  it('redirectToLogin is a no-op on the login page', () => {
    window.location.pathname = '/login';
    window.location.href = 'http://localhost:3000/login';

    redirectToLogin();

    expect(window.location.href).toBe('http://localhost:3000/login');
  });
});

describe('snackbar suppression for internal transport requests', () => {
  beforeEach(() => {
    axiosMocks.instance.get.mockReset();
    axiosMocks.instance.post.mockReset();
    clearBearerSession();
    clearXsrfToken();
    window.location.href = HOME_URL;
    window.location.pathname = '/';
  });

  it('suppresses the snackbar when the request opts out', async () => {
    await expect(
      axiosMocks.interceptors.responseRejected(
        terminal401({
          url: '/api/auth/refresh',
          method: 'post',
          suppressErrorSnackbar: true,
        }),
      ),
    ).rejects.toBeDefined();

    expect(mockDispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches the snackbar for ordinary failures', async () => {
    await expect(
      axiosMocks.interceptors.responseRejected({
        config: { url: '/api/appointment/list', method: 'get', headers: {} },
        response: { status: 500, data: {} },
      }),
    ).rejects.toBeDefined();

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'show-snackbar',
        detail: expect.objectContaining({ severity: 'error' }),
      }),
    );
  });
});

// Module-initialization behavior (legacy storage scrub and the cross-tab
// channel) needs a fresh module per test, so these run last and only use the
// dynamically imported instances — re-importing resets module state.
describe('module initialization', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.href = HOME_URL;
    window.location.pathname = '/';
  });

  it('scrubs legacy localStorage bearer tokens on load', async () => {
    localStorage.setItem('authToken', 'legacy-token');
    localStorage.setItem('tokenType', 'Bearer');

    vi.resetModules();
    await import('../../src/services/config');

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('tokenType')).toBeNull();
  });

  it('broadcasts and reacts to session-ended across tabs', async () => {
    const originalChannel = (globalThis as any).BroadcastChannel;
    const channelInstances: any[] = [];
    (globalThis as any).BroadcastChannel = class {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      postMessage = vi.fn();
      constructor(public name: string) {
        channelInstances.push(this);
      }
    };

    try {
      vi.resetModules();
      const freshConfig = await import('../../src/services/config');

      expect(channelInstances).toHaveLength(1);
      const channel = channelInstances[0];

      // Outgoing lifecycle event: only the marker, never a token.
      freshConfig.broadcastSessionEnded();
      expect(channel.postMessage).toHaveBeenCalledWith('session-ended');

      // Incoming event with a live session: clear and redirect.
      freshConfig.setBearerSession('live-token', 'Bearer');
      channel.onmessage({ data: 'session-ended' });
      expect(freshConfig.hasBearerSession()).toBe(false);
      expect(window.location.href).toBe('/login');

      // Incoming event without a session: no-op.
      window.location.href = HOME_URL;
      channel.onmessage({ data: 'session-ended' });
      expect(window.location.href).toBe(HOME_URL);
    } finally {
      (globalThis as any).BroadcastChannel = originalChannel;
    }
  });
});
