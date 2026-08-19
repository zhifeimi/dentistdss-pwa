import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';

const authMocks = vi.hoisted(() => ({
  me: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => {
  const state = {
    bearer: undefined as { accessToken: string; tokenType: string } | undefined,
  };
  return {
    state,
    ensureXsrfBootstrapped: vi.fn(),
    setBearerSession: vi.fn((accessToken: string, tokenType: string = 'Bearer') => {
      if (accessToken) {
        state.bearer = { accessToken, tokenType: tokenType || 'Bearer' };
      }
    }),
    clearBearerSession: vi.fn(() => {
      state.bearer = undefined;
    }),
    hasBearerSession: vi.fn(() => state.bearer !== undefined),
  };
});

vi.mock('../../src/services', () => ({
  default: { auth: authMocks },
}));

vi.mock('../../src/services/session', () => ({
  default: sessionMocks,
}));

import { AuthProvider } from '../../src/context/auth';

describe('AuthProvider session restore wiring', () => {
  beforeEach(() => {
    authMocks.me.mockReset();
    authMocks.logout.mockReset();
    sessionMocks.ensureXsrfBootstrapped.mockReset();
    authMocks.refresh.mockReset();
    sessionMocks.setBearerSession.mockClear();
    sessionMocks.clearBearerSession.mockClear();
    sessionMocks.state.bearer = undefined;
    authMocks.me.mockResolvedValue({ id: 1, email: 'patient@example.com' });
    authMocks.logout.mockResolvedValue(undefined);
    sessionMocks.ensureXsrfBootstrapped.mockResolvedValue(undefined);
    authMocks.refresh.mockRejectedValue(new Error('no refresh cookie'));
    localStorage.clear();
  });

  it('restores the session from the refresh cookie on load', async () => {
    authMocks.refresh.mockImplementation(async () => {
      sessionMocks.setBearerSession('restored-token', 'Bearer');
      return { accessToken: 'restored-token', tokenType: 'Bearer' };
    });

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.me).toHaveBeenCalledTimes(1));
    expect(authMocks.refresh).toHaveBeenCalledTimes(1);
    expect(sessionMocks.ensureXsrfBootstrapped).toHaveBeenCalledTimes(1);
    expect(authMocks.logout).not.toHaveBeenCalled();
  });

  it('stays anonymous without logout when no refresh cookie exists', async () => {
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.refresh).toHaveBeenCalledTimes(1));
    expect(authMocks.me).not.toHaveBeenCalled();
    expect(authMocks.logout).not.toHaveBeenCalled();
    // The XSRF bootstrap is still prewarmed for later cookie-session calls.
    expect(sessionMocks.ensureXsrfBootstrapped).toHaveBeenCalledTimes(1);
  });

  it('skips the refresh round-trip when a session is already in memory', async () => {
    sessionMocks.setBearerSession('in-memory-token', 'Bearer');

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.me).toHaveBeenCalledTimes(1));
    expect(authMocks.refresh).not.toHaveBeenCalled();
    expect(authMocks.logout).not.toHaveBeenCalled();
  });

  it('falls back to logout when the restored session is rejected', async () => {
    authMocks.refresh.mockImplementation(async () => {
      sessionMocks.setBearerSession('expired-token', 'Bearer');
      return { accessToken: 'expired-token', tokenType: 'Bearer' };
    });
    authMocks.me.mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.logout).toHaveBeenCalledTimes(1));
    expect(authMocks.refresh).toHaveBeenCalledTimes(1);
  });
});
