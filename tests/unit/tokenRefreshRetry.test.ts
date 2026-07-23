import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
  const interceptors = {
    responseRejected: undefined as any,
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
  return { instance, interceptors };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosMocks.instance),
  },
}));

import { clearXsrfToken } from '../../src/services/config';

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
    axiosMocks.instance.get.mockReset();
    axiosMocks.instance.post.mockReset();
    axiosMocks.instance.mockReset();
    clearXsrfToken();
    localStorage.clear();
    window.location.href = HOME_URL;
  });

  it('refreshes once and replays the failed request with the rotated token', async () => {
    localStorage.setItem('authToken', 'expired-token');
    axiosMocks.instance.get.mockResolvedValue({});
    axiosMocks.instance.post.mockResolvedValue({
      accessToken: 'rotated-token',
      tokenType: 'Bearer',
    });
    axiosMocks.instance.mockResolvedValue({ id: 'replayed' });

    const result = await axiosMocks.interceptors.responseRejected(make401());

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/api/auth/refresh');
    expect(axiosMocks.instance).toHaveBeenCalledTimes(1);
    expect(axiosMocks.instance.mock.calls[0][0]._retry).toBe(true);
    expect(result).toEqual({ id: 'replayed' });
    expect(localStorage.getItem('authToken')).toBe('rotated-token');
    expect(window.location.href).toBe(HOME_URL);
  });

  it('never replays cookie-session or credential routes', async () => {
    const ineligible = [
      { url: '/api/auth/refresh', method: 'post' },
      { url: '/api/auth/logout', method: 'post' },
      { url: '/api/auth/csrf', method: 'get' },
      { url: '/api/auth/login', method: 'post' },
      { url: '/oauth2/token', method: 'post' },
    ];

    for (const route of ineligible) {
      localStorage.setItem('authToken', 'expired-token');
      window.location.href = HOME_URL;

      await expect(
        axiosMocks.interceptors.responseRejected(make401(route)),
      ).rejects.toBeDefined();

      expect(axiosMocks.instance.post).not.toHaveBeenCalled();
      expect(axiosMocks.instance).not.toHaveBeenCalled();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(window.location.href).toBe('/login');
    }
  });

  it('redirects to login when the refresh itself fails', async () => {
    localStorage.setItem('authToken', 'expired-token');
    axiosMocks.instance.get.mockResolvedValue({});
    axiosMocks.instance.post.mockRejectedValue(new Error('refresh dead'));

    await expect(
      axiosMocks.interceptors.responseRejected(make401()),
    ).rejects.toBeDefined();

    expect(axiosMocks.instance).not.toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('shares a single refresh across concurrent 401 retries', async () => {
    localStorage.setItem('authToken', 'expired-token');
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosMocks.instance.get.mockResolvedValue({});
    axiosMocks.instance.post.mockImplementation(
      () => new Promise((resolve) => {
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
    await vi.waitFor(() =>
      expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
    );
    resolveRefresh({ accessToken: 'rotated-token', tokenType: 'Bearer' });
    const results = await Promise.all([first, second]);

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1);
    expect(axiosMocks.instance).toHaveBeenCalledTimes(2);
    expect(results).toEqual(['replayed', 'replayed']);
  });

  it('does not retry a request that already retried', async () => {
    localStorage.setItem('authToken', 'expired-token');
    const error = make401();
    error.config._retry = true;

    await expect(
      axiosMocks.interceptors.responseRejected(error),
    ).rejects.toBeDefined();

    expect(axiosMocks.instance.post).not.toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('does not refresh or redirect on non-401 failures', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await expect(
      axiosMocks.interceptors.responseRejected({
        config: { url: '/api/appointment/list', method: 'get', headers: {} },
        response: { status: 500, data: {} },
      }),
    ).rejects.toBeDefined();

    expect(axiosMocks.instance.post).not.toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBe('valid-token');
    expect(window.location.href).toBe(HOME_URL);
  });
});
