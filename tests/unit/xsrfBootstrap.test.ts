import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
  const interceptors = {
    responseFulfilled: undefined as any,
  };
  const state = { createCount: 0 };
  const rawAuth: any = {
    get: vi.fn(),
    post: vi.fn(),
  };
  const ordinary: any = {
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: (onFulfilled: any) => {
          interceptors.responseFulfilled = onFulfilled;
        },
      },
    },
  };
  return { state, rawAuth, ordinary, interceptors };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => {
      const client = axiosMocks.state.createCount % 2 === 0
        ? axiosMocks.rawAuth
        : axiosMocks.ordinary;
      axiosMocks.state.createCount += 1;
      return client;
    }),
  },
}));

import {
  clearBearerSession,
  clearXsrfToken,
  ensureXsrfBootstrapped,
  getBearerSession,
  hasBearerSession,
  hasXsrfToken,
  refreshSession,
  setBearerSession,
} from '../../src/services/session';
import '../../src/services/config';

const seedXsrfToken = async (token: string): Promise<void> => {
  await axiosMocks.interceptors.responseFulfilled({
    headers: { 'X-XSRF-TOKEN': token },
    data: {},
  });
};

describe('XSRF bootstrap and session refresh transport', () => {
  beforeEach(() => {
    axiosMocks.rawAuth.get.mockReset();
    axiosMocks.rawAuth.post.mockReset();
    clearXsrfToken();
    clearBearerSession();
    localStorage.clear();
  });

  it('fetches the bootstrap endpoint when no token is held', async () => {
    axiosMocks.rawAuth.get.mockResolvedValue({});

    await ensureXsrfBootstrapped();

    expect(axiosMocks.rawAuth.get).toHaveBeenCalledWith('/api/auth/csrf');
  });

  it('skips the bootstrap fetch when a token is already held', async () => {
    await seedXsrfToken('csrf-token');
    expect(hasXsrfToken()).toBe(true);

    await ensureXsrfBootstrapped();

    expect(axiosMocks.rawAuth.get).not.toHaveBeenCalled();
  });

  it('shares one in-flight bootstrap across concurrent callers', async () => {
    let resolveBootstrap: (value: unknown) => void = () => {};
    axiosMocks.rawAuth.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBootstrap = resolve;
        }),
    );

    const first = ensureXsrfBootstrapped();
    const second = ensureXsrfBootstrapped();
    resolveBootstrap({});
    await Promise.all([first, second]);

    expect(axiosMocks.rawAuth.get).toHaveBeenCalledTimes(1);
  });

  it('never rejects and retries after a failed bootstrap', async () => {
    axiosMocks.rawAuth.get.mockRejectedValueOnce(new Error('offline'));

    await expect(ensureXsrfBootstrapped()).resolves.toBeUndefined();

    axiosMocks.rawAuth.get.mockResolvedValue({});
    await ensureXsrfBootstrapped();

    expect(axiosMocks.rawAuth.get).toHaveBeenCalledTimes(2);
  });

  it('bootstraps before the refresh request and stores the rotated token in memory', async () => {
    const order: string[] = [];
    axiosMocks.rawAuth.get.mockImplementation(async () => {
      order.push('csrf');
      return {};
    });
    axiosMocks.rawAuth.post.mockImplementation(async () => {
      order.push('refresh');
      return {
        headers: {},
        data: { accessToken: 'rotated-token', tokenType: 'Bearer' },
      };
    });

    const result = await refreshSession();

    expect(order).toEqual(['csrf', 'refresh']);
    expect(axiosMocks.rawAuth.post).toHaveBeenCalledWith(
      '/api/auth/refresh',
      undefined,
      undefined,
    );
    expect(result.accessToken).toBe('rotated-token');
    expect(getBearerSession()).toEqual({ accessToken: 'rotated-token', tokenType: 'Bearer' });
    // The bearer must never be written to web storage.
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('tokenType')).toBeNull();
  });

  it('clears local session state when the refresh fails', async () => {
    setBearerSession('stale-token', 'Bearer');
    await seedXsrfToken('csrf-token');
    axiosMocks.rawAuth.post.mockRejectedValue(new Error('refresh rejected'));

    await expect(refreshSession()).rejects.toThrow('refresh rejected');

    expect(hasBearerSession()).toBe(false);
    expect(hasXsrfToken()).toBe(false);
  });

  it('treats a refresh response without an access token as a failure', async () => {
    axiosMocks.rawAuth.get.mockResolvedValue({});
    axiosMocks.rawAuth.post.mockResolvedValue({});

    await expect(refreshSession()).rejects.toThrow('access token');

    expect(hasBearerSession()).toBe(false);
  });

  it('shares one in-flight refresh across concurrent callers', async () => {
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosMocks.rawAuth.get.mockResolvedValue({});
    axiosMocks.rawAuth.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const first = refreshSession();
    const second = refreshSession();
    await vi.waitFor(() => expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1));
    resolveRefresh({
      headers: {},
      data: { accessToken: 'shared-token', tokenType: 'Bearer' },
    });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1);
    expect(firstResult.accessToken).toBe('shared-token');
    expect(secondResult.accessToken).toBe('shared-token');
  });
});
