import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
  const interceptors = {
    responseRejected: undefined as any,
  };
  const state = { createCount: 0 };
  const rawAuth: any = {
    get: vi.fn(),
    post: vi.fn(),
  };
  const instance: any = vi.fn();
  instance.get = vi.fn();
  instance.post = vi.fn();
  instance.interceptors = {
    request: {
      use: vi.fn(),
    },
    response: {
      use: (_onFulfilled: any, onRejected: any) => {
        interceptors.responseRejected = onRejected;
      },
    },
  };
  return { state, rawAuth, instance, interceptors };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => {
      const client = axiosMocks.state.createCount % 2 === 0
        ? axiosMocks.rawAuth
        : axiosMocks.instance;
      axiosMocks.state.createCount += 1;
      return client;
    }),
  },
}));

import {
  clearBearerSession,
  clearXsrfToken,
  getBearerSession,
  hasBearerSession,
  setBearerSession,
} from '../../src/services/session';
import '../../src/services/config';

const HOME_URL = 'http://localhost:3000/';

const make401 = (overrides: Record<string, unknown> = {}) => ({
  config: {
    url: '/api/appointment/list',
    method: 'get',
    headers: {},
    ...overrides,
  },
  response: { status: 401, data: {} },
});

describe('401 refresh-retry transport', () => {
  beforeEach(() => {
    axiosMocks.rawAuth.get.mockReset();
    axiosMocks.rawAuth.post.mockReset();
    axiosMocks.instance.mockReset();
    clearXsrfToken();
    clearBearerSession();
    localStorage.clear();
    window.location.href = HOME_URL;
  });

  it('refreshes once and replays the failed request with the rotated token', async () => {
    setBearerSession('expired-token', 'Bearer');
    axiosMocks.rawAuth.get.mockResolvedValue({});
    axiosMocks.rawAuth.post.mockResolvedValue({
      headers: {},
      data: {
        accessToken: 'rotated-token',
        tokenType: 'Bearer',
      },
    });
    axiosMocks.instance.mockResolvedValue({ id: 'replayed' });

    const result = await axiosMocks.interceptors.responseRejected(make401());

    expect(axiosMocks.rawAuth.post).toHaveBeenCalledWith(
      '/api/auth/refresh',
      undefined,
      undefined,
    );
    expect(axiosMocks.instance).toHaveBeenCalledTimes(1);
    expect(axiosMocks.instance.mock.calls[0][0]._retry).toBe(true);
    expect(result).toEqual({ id: 'replayed' });
    expect(getBearerSession()).toEqual({ accessToken: 'rotated-token', tokenType: 'Bearer' });
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(window.location.href).toBe(HOME_URL);
  });

  it('never replays cookie-session or credential routes', async () => {
    const ineligible = [
      { url: '/api/auth/refresh', method: 'post', redirects: false },
      { url: '/api/auth/logout', method: 'post', redirects: false },
      { url: '/api/auth/csrf', method: 'get', redirects: false },
      { url: '/api/auth/login', method: 'post', redirects: true },
      { url: '/oauth2/token', method: 'post', redirects: true },
    ];

    for (const route of ineligible) {
      setBearerSession('expired-token', 'Bearer');
      window.location.href = HOME_URL;

      await expect(
        axiosMocks.interceptors.responseRejected(make401(route)),
      ).rejects.toBeDefined();

      expect(axiosMocks.rawAuth.post).not.toHaveBeenCalled();
      expect(axiosMocks.instance).not.toHaveBeenCalled();
      expect(hasBearerSession()).toBe(false);
      // Cookie-session endpoints own their failure handling; credential
      // endpoints end the session and redirect.
      expect(window.location.href).toBe(route.redirects ? '/login' : HOME_URL);
    }
  });

  it('redirects to login when the refresh itself fails', async () => {
    setBearerSession('expired-token', 'Bearer');
    axiosMocks.rawAuth.get.mockResolvedValue({});
    axiosMocks.rawAuth.post.mockRejectedValue(new Error('refresh dead'));

    await expect(
      axiosMocks.interceptors.responseRejected(make401()),
    ).rejects.toBeDefined();

    expect(axiosMocks.instance).not.toHaveBeenCalled();
    expect(hasBearerSession()).toBe(false);
    expect(window.location.href).toBe('/login');
  });

  it('shares a single refresh across concurrent 401 retries', async () => {
    setBearerSession('expired-token', 'Bearer');
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosMocks.rawAuth.get.mockResolvedValue({});
    axiosMocks.rawAuth.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    axiosMocks.instance.mockResolvedValue('replayed');

    const first = axiosMocks.interceptors.responseRejected(
      make401({ url: '/api/appointment/list' }),
    );
    const second = axiosMocks.interceptors.responseRejected(
      make401({ url: '/api/clinical-records/list' }),
    );
    await vi.waitFor(() => expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1));
    resolveRefresh({
      headers: {},
      data: { accessToken: 'rotated-token', tokenType: 'Bearer' },
    });
    const results = await Promise.all([first, second]);

    expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1);
    expect(axiosMocks.instance).toHaveBeenCalledTimes(2);
    expect(results).toEqual(['replayed', 'replayed']);
  });

  it('does not retry a request that already retried', async () => {
    setBearerSession('expired-token', 'Bearer');
    const error = make401();
    error.config._retry = true;

    await expect(
      axiosMocks.interceptors.responseRejected(error),
    ).rejects.toBeDefined();

    expect(axiosMocks.rawAuth.post).not.toHaveBeenCalled();
    expect(hasBearerSession()).toBe(false);
    expect(window.location.href).toBe('/login');
  });

  it('does not refresh or redirect on non-401 failures', async () => {
    setBearerSession('valid-token', 'Bearer');

    await expect(
      axiosMocks.interceptors.responseRejected({
        config: { url: '/api/appointment/list', method: 'get', headers: {} },
        response: { status: 500, data: {} },
      }),
    ).rejects.toBeDefined();

    expect(axiosMocks.rawAuth.post).not.toHaveBeenCalled();
    expect(getBearerSession()).toEqual({ accessToken: 'valid-token', tokenType: 'Bearer' });
    expect(window.location.href).toBe(HOME_URL);
  });

  it('clears state without redirecting when an anonymous call gets a 401', async () => {
    axiosMocks.rawAuth.get.mockRejectedValue(new Error('no cookie session'));
    axiosMocks.rawAuth.post.mockRejectedValue(new Error('no cookie session'));

    await expect(
      axiosMocks.interceptors.responseRejected(make401()),
    ).rejects.toBeDefined();

    // The refresh is attempted once (the call is retry-eligible) but no
    // redirect or broadcast follows its failure: there was no session.
    expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1);
    expect(hasBearerSession()).toBe(false);
    expect(window.location.href).toBe(HOME_URL);
  });
});
