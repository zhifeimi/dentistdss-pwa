import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';

const authMocks = vi.hoisted(() => ({
  me: vi.fn(),
  logout: vi.fn(),
  ensureXsrfBootstrapped: vi.fn(),
}));

vi.mock('../../src/services', () => ({
  default: { auth: authMocks },
}));

import { AuthProvider } from '../../src/context/auth';

describe('AuthProvider XSRF bootstrap wiring', () => {
  beforeEach(() => {
    authMocks.me.mockReset();
    authMocks.logout.mockReset();
    authMocks.ensureXsrfBootstrapped.mockReset();
    authMocks.me.mockResolvedValue({ id: 1, email: 'patient@example.com' });
    authMocks.logout.mockResolvedValue(undefined);
    authMocks.ensureXsrfBootstrapped.mockResolvedValue(undefined);
    localStorage.clear();
  });

  it('prewarms the XSRF bootstrap when a stored session exists', async () => {
    localStorage.setItem('authToken', 'access-token');

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.me).toHaveBeenCalledTimes(1));
    expect(authMocks.ensureXsrfBootstrapped).toHaveBeenCalledTimes(1);
  });

  it('skips the XSRF bootstrap for anonymous visitors', () => {
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    expect(authMocks.me).not.toHaveBeenCalled();
    expect(authMocks.ensureXsrfBootstrapped).not.toHaveBeenCalled();
  });

  it('falls back to logout when the stored session is rejected', async () => {
    localStorage.setItem('authToken', 'expired-token');
    authMocks.me.mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authMocks.logout).toHaveBeenCalledTimes(1));
    expect(authMocks.ensureXsrfBootstrapped).toHaveBeenCalledTimes(1);
  });
});
