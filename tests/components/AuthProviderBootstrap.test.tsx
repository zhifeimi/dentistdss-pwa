import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const authMocks = vi.hoisted(() => ({
  me: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  loginWithGoogleIdToken: vi.fn(),
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

// Records the logout so Back afterwards can't hand the next login this page
const noteLogout = vi.hoisted(() => vi.fn());
vi.mock('../../src/utils/returnPath', () => ({ noteLogout }));

import { AuthProvider, useAuth } from '../../src/context/auth';

const GoogleLoginHarness = () => {
  const auth = useAuth();
  return (
    <button type="button" onClick={() => void auth.googleIdLogin('google-id-token', 'server-nonce')}>
      Sign in
    </button>
  );
};

describe('AuthProvider session restore wiring', () => {
  beforeEach(() => {
    authMocks.me.mockReset();
    authMocks.logout.mockReset();
    sessionMocks.ensureXsrfBootstrapped.mockReset();
    authMocks.refresh.mockReset();
    authMocks.loginWithGoogleIdToken.mockReset();
    sessionMocks.setBearerSession.mockClear();
    sessionMocks.clearBearerSession.mockClear();
    sessionMocks.state.bearer = undefined;
    authMocks.me.mockResolvedValue({ id: 1, email: 'patient@example.com' });
    authMocks.logout.mockResolvedValue(undefined);
    sessionMocks.ensureXsrfBootstrapped.mockResolvedValue(undefined);
    authMocks.refresh.mockRejectedValue(new Error('no refresh cookie'));
    localStorage.clear();
    noteLogout.mockClear();
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

  it('forwards the Google credential and nonce through the auth context', async () => {
    authMocks.loginWithGoogleIdToken.mockResolvedValue({
      accessToken: 'google-access-token',
      tokenType: 'Bearer',
      user: { id: 1, email: 'patient@example.com' },
    });

    render(
      <AuthProvider>
        <GoogleLoginHarness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(authMocks.loginWithGoogleIdToken).toHaveBeenCalledWith(
        'google-id-token',
        'server-nonce',
      )
    );
  });

  it('clears the authenticated UI and records the logout before the server logout finishes', async () => {
    authMocks.refresh.mockImplementation(async () => {
      sessionMocks.setBearerSession('restored-token', 'Bearer');
      return { accessToken: 'restored-token', tokenType: 'Bearer' };
    });
    let finishLogout: (() => void) | undefined;
    authMocks.logout.mockImplementation(() => new Promise<void>((resolve) => {
      finishLogout = resolve;
    }));

    const LogoutHarness = () => {
      const { isAuthenticated, logout } = useAuth();
      return (
        <>
          <output data-testid="auth-status">
            {isAuthenticated ? 'authenticated' : 'anonymous'}
          </output>
          <button type="button" onClick={() => void logout()}>Log out</button>
        </>
      );
    };

    render(
      <AuthProvider>
        <LogoutHarness />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated'));
    expect(noteLogout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(noteLogout).toHaveBeenCalledTimes(1);

    try {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    } finally {
      await React.act(async () => {
        finishLogout?.();
      });
    }
    await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous'));
  });
});
