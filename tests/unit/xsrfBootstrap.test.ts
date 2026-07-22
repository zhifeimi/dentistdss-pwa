import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  hasXsrfToken: vi.fn(),
  clearXsrfToken: vi.fn(),
}));

vi.mock('../../src/services/config', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
  },
  hasXsrfToken: mocks.hasXsrfToken,
  clearXsrfToken: mocks.clearXsrfToken,
}));

import authAPI from '../../src/services/auth';

describe('XSRF bootstrap lifecycle', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
    mocks.hasXsrfToken.mockReset();
    mocks.hasXsrfToken.mockReturnValue(false);
    mocks.clearXsrfToken.mockReset();
    localStorage.clear();
  });

  it('fetches the bootstrap endpoint when no token is held', async () => {
    mocks.get.mockResolvedValue({});

    await authAPI.ensureXsrfBootstrapped();

    expect(mocks.get).toHaveBeenCalledWith('/api/auth/csrf');
  });

  it('skips the bootstrap fetch when a token is already held', async () => {
    mocks.hasXsrfToken.mockReturnValue(true);

    await authAPI.ensureXsrfBootstrapped();

    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('shares one in-flight bootstrap across concurrent callers', async () => {
    let resolveBootstrap: (value: unknown) => void = () => {};
    mocks.get.mockImplementation(
      () => new Promise((resolve) => {
        resolveBootstrap = resolve;
      }),
    );

    const first = authAPI.ensureXsrfBootstrapped();
    const second = authAPI.ensureXsrfBootstrapped();
    resolveBootstrap({});
    await Promise.all([first, second]);

    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it('never rejects and retries after a failed bootstrap', async () => {
    mocks.get.mockRejectedValueOnce(new Error('offline'));

    await expect(authAPI.ensureXsrfBootstrapped()).resolves.toBeUndefined();

    mocks.get.mockResolvedValue({});
    await authAPI.ensureXsrfBootstrapped();

    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it('bootstraps before the refresh request', async () => {
    const order: string[] = [];
    mocks.get.mockImplementation(async () => {
      order.push('csrf');
      return {};
    });
    mocks.post.mockImplementation(async () => {
      order.push('refresh');
      return { accessToken: 'rotated-token', tokenType: 'Bearer' };
    });

    await authAPI.refresh();

    expect(order).toEqual(['csrf', 'refresh']);
    expect(mocks.post).toHaveBeenCalledWith('/api/auth/refresh');
    expect(localStorage.getItem('authToken')).toBe('rotated-token');
  });

  it('bootstraps before logout and clears local state regardless', async () => {
    localStorage.setItem('authToken', 'access-token');
    localStorage.setItem('tokenType', 'Bearer');
    const order: string[] = [];
    mocks.get.mockImplementation(async () => {
      order.push('csrf');
      return {};
    });
    mocks.post.mockImplementation(async () => {
      order.push('logout');
      return {};
    });

    await authAPI.logout();

    expect(order).toEqual(['csrf', 'logout']);
    expect(mocks.post).toHaveBeenCalledWith('/api/auth/logout');
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(mocks.clearXsrfToken).toHaveBeenCalled();
  });
});
