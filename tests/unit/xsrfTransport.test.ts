import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
  const interceptors = {
    requestFulfilled: undefined as any,
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
        use: (onFulfilled: any) => {
          interceptors.requestFulfilled = onFulfilled;
        },
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

import { clearBearerSession, clearXsrfToken, setBearerSession } from '../../src/services/session';
import '../../src/services/config';

const { interceptors } = axiosMocks;

describe('XSRF transport', () => {
  beforeEach(() => {
    clearXsrfToken();
    clearBearerSession();
    localStorage.clear();
  });

  it('captures the API XSRF response header without changing envelope unwrapping', async () => {
    const result = await interceptors.responseFulfilled({
      headers: { 'x-xsrf-token': 'first-token' },
      data: { success: true, dataObject: { id: 1 } },
    });

    expect(result).toEqual({ id: 1 });

    const request = interceptors.requestFulfilled({
      url: '/api/auth/refresh',
      method: 'post',
      headers: {},
    });

    expect(request.headers['X-XSRF-TOKEN']).toBe('first-token');
  });

  it('sends the token only to exact API-origin refresh and logout requests', async () => {
    await interceptors.responseFulfilled({
      headers: { get: () => 'csrf-token' },
      data: {},
    });

    const refresh = interceptors.requestFulfilled({
      url: '/api/auth/refresh?source=restore',
      method: 'post',
      headers: {},
    });
    const logout = interceptors.requestFulfilled({
      url: '/api/auth/logout',
      method: 'post',
      headers: {},
    });
    const unrelated = interceptors.requestFulfilled({
      url: '/api/appointment/create',
      method: 'post',
      headers: { 'X-XSRF-TOKEN': 'caller-supplied' },
    });
    const external = interceptors.requestFulfilled({
      url: 'https://attacker.example/api/auth/refresh',
      method: 'post',
      headers: {},
    });

    expect(refresh.headers['X-XSRF-TOKEN']).toBe('csrf-token');
    expect(logout.headers['X-XSRF-TOKEN']).toBe('csrf-token');
    expect(unrelated.headers['X-XSRF-TOKEN']).toBeUndefined();
    expect(external.headers['X-XSRF-TOKEN']).toBeUndefined();
  });

  it('omits bearer tokens from cookie-backed refresh and logout requests', async () => {
    setBearerSession('expired-access-token', 'Bearer');
    await interceptors.responseFulfilled({
      headers: { 'X-XSRF-TOKEN': 'csrf-token' },
      data: {},
    });

    const refresh = interceptors.requestFulfilled({
      url: '/api/auth/refresh',
      method: 'post',
      headers: { Authorization: 'caller-supplied' },
    });
    const logout = interceptors.requestFulfilled({
      url: '/api/auth/logout',
      method: 'post',
      headers: { Authorization: 'caller-supplied' },
    });

    expect(refresh.headers.Authorization).toBeUndefined();
    expect(logout.headers.Authorization).toBeUndefined();
    expect(refresh.headers['X-XSRF-TOKEN']).toBe('csrf-token');
    expect(logout.headers['X-XSRF-TOKEN']).toBe('csrf-token');
  });

  it('uses a rotated token and clears it on session cleanup', async () => {
    await interceptors.responseFulfilled({
      headers: { 'X-XSRF-TOKEN': 'old-token' },
      data: {},
    });
    await interceptors.responseFulfilled({
      headers: { 'X-XSRF-TOKEN': 'rotated-token' },
      data: {},
    });

    const rotated = interceptors.requestFulfilled({
      url: '/api/auth/logout',
      method: 'post',
      headers: {},
    });
    clearXsrfToken();
    const cleared = interceptors.requestFulfilled({
      url: '/api/auth/logout',
      method: 'post',
      headers: {},
    });

    expect(rotated.headers['X-XSRF-TOKEN']).toBe('rotated-token');
    expect(cleared.headers['X-XSRF-TOKEN']).toBeUndefined();
  });

  it('omits bearer tokens from the public CSRF bootstrap request', async () => {
    setBearerSession('stale-access-token', 'Bearer');
    await interceptors.responseFulfilled({
      headers: { 'X-XSRF-TOKEN': 'csrf-token' },
      data: {},
    });

    const csrfBootstrap = interceptors.requestFulfilled({
      url: '/api/auth/csrf',
      method: 'get',
      headers: { Authorization: 'caller-supplied' },
    });

    expect(csrfBootstrap.headers.Authorization).toBeUndefined();
    expect(csrfBootstrap.headers['X-XSRF-TOKEN']).toBeUndefined();
  });

  it('attaches the in-memory bearer to same-origin requests only', () => {
    setBearerSession('access-token', 'Bearer');

    const unrelated = interceptors.requestFulfilled({
      url: '/api/appointment/list',
      method: 'get',
      headers: {},
    });
    const external = interceptors.requestFulfilled({
      url: 'https://attacker.example/api/auth/csrf',
      method: 'get',
      headers: {},
    });
    const externalWithCallerAuth = interceptors.requestFulfilled({
      url: 'https://attacker.example/api/appointment/list',
      method: 'get',
      headers: { Authorization: 'Bearer caller-supplied' },
    });

    expect(unrelated.headers.Authorization).toBe('Bearer access-token');
    // The bearer is for this API origin only: it (and any caller-supplied
    // Authorization header) must never leak to a foreign origin.
    expect(external.headers.Authorization).toBeUndefined();
    expect(externalWithCallerAuth.headers.Authorization).toBeUndefined();
  });
});
