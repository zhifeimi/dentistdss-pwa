import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  googleIdLogin: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  navigate: vi.fn(),
  locationState: null as unknown,
}));

vi.mock('react-router', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: mocks.locationState }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({
    googleIdLogin: mocks.googleIdLogin,
    login: mocks.login,
    signup: mocks.signup,
  }),
}));

vi.mock('../../src/components/Auth/GoogleAuthProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../src/components/Auth/GoogleSignInButton', () => ({
  default: (
    { onSuccess }: { onSuccess: (response: { credential: string }, nonce: string) => void },
  ) => (
    <button
      type='button'
      onClick={() => onSuccess({ credential: 'google-id-token' }, 'server-nonce')}
    >
      Continue with Google
    </button>
  ),
}));

vi.mock('../../src/components/Home/AuthBrandPanel', () => ({ default: () => null }));

import Login from '../../src/pages/Home/Login';
import Signup from '../../src/pages/Home/Signup';

describe('Google auth page wiring', () => {
  beforeEach(() => {
    mocks.googleIdLogin.mockReset().mockResolvedValue({ id: 1, email: 'patient@example.com' });
    mocks.login.mockReset();
    mocks.signup.mockReset();
    mocks.navigate.mockReset();
    mocks.locationState = null;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  it.each([
    ['login', Login],
    ['signup', Signup],
  ])('passes the shared Google challenge from the %s page to auth context', async (_name, Page) => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() =>
      expect(mocks.googleIdLogin).toHaveBeenCalledWith('google-id-token', 'server-nonce')
    );
  });

  // A visitor sent to log in from "Book a visit" may sign up with Google instead
  it.each([
    ['login', Login],
    ['signup', Signup],
  ])('returns to the page that asked for a login after Google on the %s page', async (_name, Page) => {
    mocks.locationState = { from: { pathname: '/appointments', search: '?book=7' } };
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith('/appointments?book=7', { replace: true })
    );
  });
});
