import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
  const rawAuth = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    create: vi.fn(() => rawAuth),
    rawAuth,
  };
});

vi.mock('axios', () => ({
  default: {
    create: axiosMocks.create,
  },
}));

import {
  type BrowserEffects,
  createSessionLifecycle,
  type SessionChannel,
} from '../../src/services/session';

interface BrowserHarness {
  browserEffects: BrowserEffects;
  postMessage: ReturnType<typeof vi.fn>;
  redirectToLogin: ReturnType<typeof vi.fn>;
  emit: (message: unknown) => void;
}

const makeBrowserHarness = (): BrowserHarness => {
  let onMessage: ((message: unknown) => void) | undefined;
  const postMessage = vi.fn();
  const redirectToLogin = vi.fn();
  const channel: SessionChannel = { postMessage };

  return {
    browserEffects: {
      createSessionChannel: (handler) => {
        onMessage = handler;
        return channel;
      },
      redirectToLogin,
    },
    postMessage,
    redirectToLogin,
    emit: (message) => onMessage?.(message),
  };
};

describe('session lifecycle', () => {
  beforeEach(() => {
    axiosMocks.create.mockClear();
    axiosMocks.rawAuth.get.mockReset();
    axiosMocks.rawAuth.post.mockReset();
    localStorage.clear();
  });

  it('keeps bearer state in memory and defaults the token type', () => {
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);

    lifecycle.setBearerSession('memory-token');

    expect(lifecycle.getBearerSession()).toEqual({
      accessToken: 'memory-token',
      tokenType: 'Bearer',
    });
    expect(lifecycle.hasBearerSession()).toBe(true);
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('tokenType')).toBeNull();

    lifecycle.clearBearerSession();

    expect(lifecycle.hasBearerSession()).toBe(false);
    expect(lifecycle.getBearerSession()).toBeUndefined();
  });

  it('captures XSRF response headers from ordinary and Axios header bags', () => {
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);

    lifecycle.captureXsrfFromHeaders({ 'x-xsrf-token': 'first-token' });
    expect(lifecycle.getXsrfToken()).toBe('first-token');

    lifecycle.captureXsrfFromHeaders({ get: () => 'rotated-token' });
    expect(lifecycle.getXsrfToken()).toBe('rotated-token');
    expect(lifecycle.hasXsrfToken()).toBe(true);
  });

  it('uses one raw bootstrap request for concurrent callers', async () => {
    let resolveBootstrap: (value: unknown) => void = () => {};
    axiosMocks.rawAuth.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBootstrap = resolve;
        }),
    );
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);

    const first = lifecycle.ensureXsrfBootstrapped();
    const second = lifecycle.ensureXsrfBootstrapped();
    resolveBootstrap({ headers: { 'X-XSRF-TOKEN': 'csrf-token' } });
    await Promise.all([first, second]);

    expect(axiosMocks.rawAuth.get).toHaveBeenCalledTimes(1);
    expect(axiosMocks.rawAuth.get).toHaveBeenCalledWith('/api/auth/csrf');
    expect(lifecycle.getXsrfToken()).toBe('csrf-token');
  });

  it('retries bootstrap after a failed request', async () => {
    axiosMocks.rawAuth.get
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ headers: { 'X-XSRF-TOKEN': 'csrf-token' } });
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);

    await expect(lifecycle.ensureXsrfBootstrapped()).resolves.toBeUndefined();
    await expect(lifecycle.ensureXsrfBootstrapped()).resolves.toBeUndefined();

    expect(axiosMocks.rawAuth.get).toHaveBeenCalledTimes(2);
    expect(lifecycle.getXsrfToken()).toBe('csrf-token');
  });

  it('shares one refresh and replaces bearer and XSRF state from the response', async () => {
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosMocks.rawAuth.get.mockResolvedValue({
      headers: { 'X-XSRF-TOKEN': 'bootstrap-token' },
    });
    axiosMocks.rawAuth.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);

    const first = lifecycle.refreshSession();
    const second = lifecycle.refreshSession();
    await vi.waitFor(() => expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1));

    expect(axiosMocks.rawAuth.post).toHaveBeenCalledWith(
      '/api/auth/refresh',
      undefined,
      { headers: { 'X-XSRF-TOKEN': 'bootstrap-token' } },
    );
    resolveRefresh({
      headers: { 'X-XSRF-TOKEN': 'rotated-token' },
      data: {
        dataObject: {
          accessToken: 'rotated-access-token',
          tokenType: 'Bearer',
          user: { id: 1 },
        },
      },
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toEqual(secondResult);
    expect(firstResult.accessToken).toBe('rotated-access-token');
    expect(lifecycle.getBearerSession()).toEqual({
      accessToken: 'rotated-access-token',
      tokenType: 'Bearer',
    });
    expect(lifecycle.getXsrfToken()).toBe('rotated-token');
  });

  it('clears local state when refresh fails and allows a later retry', async () => {
    axiosMocks.rawAuth.get.mockResolvedValue({
      headers: { 'X-XSRF-TOKEN': 'csrf-token' },
    });
    axiosMocks.rawAuth.post
      .mockRejectedValueOnce(new Error('refresh rejected'))
      .mockResolvedValueOnce({
        headers: {},
        data: { accessToken: 'retry-token', tokenType: 'Bearer' },
      });
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);
    lifecycle.setBearerSession('stale-token');

    await expect(lifecycle.refreshSession()).rejects.toThrow('refresh rejected');
    expect(lifecycle.hasBearerSession()).toBe(false);
    expect(lifecycle.hasXsrfToken()).toBe(false);

    await expect(lifecycle.refreshSession()).resolves.toMatchObject({
      accessToken: 'retry-token',
    });
  });

  it('does not restore a bearer when refresh resolves after termination', async () => {
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosMocks.rawAuth.get.mockResolvedValue({ headers: {} });
    axiosMocks.rawAuth.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);

    const refresh = lifecycle.refreshSession();
    await vi.waitFor(() => expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1));
    lifecycle.terminateSession({ redirect: false });
    resolveRefresh({
      headers: { 'X-XSRF-TOKEN': 'stale-csrf' },
      data: { accessToken: 'stale-access-token', tokenType: 'Bearer' },
    });
    await refresh.catch(() => undefined);

    expect(lifecycle.hasBearerSession()).toBe(false);
    expect(lifecycle.hasXsrfToken()).toBe(false);
  });

  it('does not let a late refresh failure clear a newer bearer', async () => {
    let rejectRefresh: (reason?: unknown) => void = () => {};
    axiosMocks.rawAuth.get.mockResolvedValue({ headers: {} });
    axiosMocks.rawAuth.post.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRefresh = reject;
        }),
    );
    const lifecycle = createSessionLifecycle(makeBrowserHarness().browserEffects);

    const refresh = lifecycle.refreshSession();
    await vi.waitFor(() => expect(axiosMocks.rawAuth.post).toHaveBeenCalledTimes(1));
    lifecycle.setBearerSession('newer-access-token', 'Bearer');
    rejectRefresh(new Error('stale refresh failure'));
    await expect(refresh).rejects.toMatchObject({
      name: 'SessionRefreshSupersededError',
    });

    expect(lifecycle.getBearerSession()).toEqual({
      accessToken: 'newer-access-token',
      tokenType: 'Bearer',
    });
  });

  it('clears local state without broadcasting or redirecting when termination is explicit', () => {
    const harness = makeBrowserHarness();
    const lifecycle = createSessionLifecycle(harness.browserEffects);
    lifecycle.setBearerSession('live-token');
    lifecycle.captureXsrfFromHeaders({ 'X-XSRF-TOKEN': 'csrf-token' });

    lifecycle.terminateSession({ redirect: false });

    expect(lifecycle.hasBearerSession()).toBe(false);
    expect(lifecycle.hasXsrfToken()).toBe(false);
    expect(harness.postMessage).toHaveBeenCalledWith('session-ended');
    expect(harness.redirectToLogin).not.toHaveBeenCalled();
  });

  it('terminates a live session synchronously and redirects when requested', () => {
    const harness = makeBrowserHarness();
    const lifecycle = createSessionLifecycle(harness.browserEffects);

    lifecycle.setBearerSession('live-token');
    lifecycle.terminateSession({ redirect: true });

    expect(lifecycle.hasBearerSession()).toBe(false);
    expect(lifecycle.hasXsrfToken()).toBe(false);
    expect(harness.postMessage).toHaveBeenCalledWith('session-ended');
    expect(harness.redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it('broadcasts only the lifecycle marker and never session credentials', () => {
    const harness = makeBrowserHarness();
    const lifecycle = createSessionLifecycle(harness.browserEffects);
    lifecycle.setBearerSession('secret-access-token', 'Custom');

    lifecycle.terminateSession({ redirect: false });

    expect(harness.postMessage).toHaveBeenCalledTimes(1);
    expect(harness.postMessage).toHaveBeenCalledWith('session-ended');
    expect(JSON.stringify(harness.postMessage.mock.calls)).not.toContain('secret-access-token');
  });

  it('handles a remote session-ended marker without rebroadcasting', () => {
    const harness = makeBrowserHarness();
    const lifecycle = createSessionLifecycle(harness.browserEffects);
    lifecycle.setBearerSession('remote-tab-token');
    lifecycle.captureXsrfFromHeaders({ 'X-XSRF-TOKEN': 'remote-csrf' });

    harness.emit('session-ended');

    expect(lifecycle.hasBearerSession()).toBe(false);
    expect(lifecycle.hasXsrfToken()).toBe(false);
    expect(harness.redirectToLogin).toHaveBeenCalledTimes(1);
    expect(harness.postMessage).not.toHaveBeenCalled();
  });

  it('ignores unrelated or anonymous remote markers', () => {
    const harness = makeBrowserHarness();
    const lifecycle = createSessionLifecycle(harness.browserEffects);

    harness.emit('other-message');
    harness.emit('session-ended');

    expect(harness.redirectToLogin).not.toHaveBeenCalled();
    expect(harness.postMessage).not.toHaveBeenCalled();
  });

  it('scrubs legacy bearer storage during production singleton initialization', async () => {
    localStorage.setItem('authToken', 'legacy-token');
    localStorage.setItem('tokenType', 'Bearer');

    vi.resetModules();
    await import('../../src/services/session');

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('tokenType')).toBeNull();
  });
});
