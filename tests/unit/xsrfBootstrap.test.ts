import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
  const interceptors = {
    responseFulfilled: undefined as any,
  };
  const instance: any = vi.fn();
  instance.get = vi.fn();
  instance.post = vi.fn();
  instance.interceptors = {
    request: {
      use: vi.fn(),
    },
    response: {
      use: (onFulfilled: any) => {
        interceptors.responseFulfilled = onFulfilled;
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
  clearXsrfToken,
  ensureXsrfBootstrapped,
  hasXsrfToken,
  refreshSession,
} from '../../src/services/config';

const seedXsrfToken = async (token: string): Promise<void> => {
  await axiosMocks.interceptors.responseFulfilled({
    headers: { 'X-XSRF-TOKEN': token },
    data: {},
  });
};

describe('XSRF bootstrap and session refresh transport', () => {
  beforeEach(() => {
    axiosMocks.instance.get.mockReset();
    axiosMocks.instance.post.mockReset();
    axiosMocks.instance.mockReset();
    clearXsrfToken();
    localStorage.clear();
  });

  it('fetches the bootstrap endpoint when no token is held', async () => {
    axiosMocks.instance.get.mockResolvedValue({});

    await ensureXsrfBootstrapped();

    expect(axiosMocks.instance.get).toHaveBeenCalledWith('/api/auth/csrf');
  });

  it('skips the bootstrap fetch when a token is already held', async () => {
    await seedXsrfToken('csrf-token');
    expect(hasXsrfToken()).toBe(true);

    await ensureXsrfBootstrapped();

    expect(axiosMocks.instance.get).not.toHaveBeenCalled();
  });

  it('shares one in-flight bootstrap across concurrent callers', async () => {
    let resolveBootstrap: (value: unknown) => void = () => {};
    axiosMocks.instance.get.mockImplementation(
      () => new Promise((resolve) => {
        resolveBootstrap = resolve;
      }),
    );

    const first = ensureXsrfBootstrapped();
    const second = ensureXsrfBootstrapped();
    resolveBootstrap({});
    await Promise.all([first, second]);

    expect(axiosMocks.instance.get).toHaveBeenCalledTimes(1);
  });

  it('never rejects and retries after a failed bootstrap', async () => {
    axiosMocks.instance.get.mockRejectedValueOnce(new Error('offline'));

    await expect(ensureXsrfBootstrapped()).resolves.toBeUndefined();

    axiosMocks.instance.get.mockResolvedValue({});
    await ensureXsrfBootstrapped();

    expect(axiosMocks.instance.get).toHaveBeenCalledTimes(2);
  });

  it('bootstraps before the refresh request and stores the rotated token', async () => {
    const order: string[] = [];
    axiosMocks.instance.get.mockImplementation(async () => {
      order.push('csrf');
      return {};
    });
    axiosMocks.instance.post.mockImplementation(async () => {
      order.push('refresh');
      return { accessToken: 'rotated-token', tokenType: 'Bearer' };
    });

    const result = await refreshSession();

    expect(order).toEqual(['csrf', 'refresh']);
    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/api/auth/refresh');
    expect(result.accessToken).toBe('rotated-token');
    expect(localStorage.getItem('authToken')).toBe('rotated-token');
    expect(localStorage.getItem('tokenType')).toBe('Bearer');
  });

  it('clears local session state when the refresh fails', async () => {
    localStorage.setItem('authToken', 'stale-token');
    localStorage.setItem('tokenType', 'Bearer');
    await seedXsrfToken('csrf-token');
    axiosMocks.instance.post.mockRejectedValue(new Error('refresh rejected'));

    await expect(refreshSession()).rejects.toThrow('refresh rejected');

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('tokenType')).toBeNull();
    expect(hasXsrfToken()).toBe(false);
  });

  it('treats a refresh response without an access token as a failure', async () => {
    axiosMocks.instance.get.mockResolvedValue({});
    axiosMocks.instance.post.mockResolvedValue({});

    await expect(refreshSession()).rejects.toThrow('access token');

    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('shares one in-flight refresh across concurrent callers', async () => {
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosMocks.instance.get.mockResolvedValue({});
    axiosMocks.instance.post.mockImplementation(
      () => new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const first = refreshSession();
    const second = refreshSession();
    await vi.waitFor(() =>
      expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
    );
    resolveRefresh({ accessToken: 'shared-token', tokenType: 'Bearer' });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1);
    expect(firstResult.accessToken).toBe('shared-token');
    expect(secondResult.accessToken).toBe('shared-token');
  });
});
