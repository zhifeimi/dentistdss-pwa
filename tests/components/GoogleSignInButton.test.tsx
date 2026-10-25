import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  getGoogleNonce: vi.fn(),
  googleLogin: vi.fn(),
}));

vi.mock('../../src/services/auth', () => ({
  default: {
    getGoogleNonce: mocks.getGoogleNonce,
  },
}));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: (props: Record<string, unknown>) => (
    <button
      type='button'
      data-nonce={String(props.nonce ?? '')}
      onClick={() => mocks.googleLogin(props)}
    >
      Continue with Google
    </button>
  ),
}));

import GoogleSignInButton from '../../src/components/Auth/GoogleSignInButton';

describe('GoogleSignInButton nonce handshake', () => {
  beforeEach(() => {
    mocks.getGoogleNonce.mockReset();
    mocks.googleLogin.mockReset();
  });

  it('renders GIS with the fetched nonce and passes that nonce with the credential', async () => {
    mocks.getGoogleNonce.mockResolvedValue('nonce-one');
    const onSuccess = vi.fn().mockResolvedValue(undefined);

    render(
      <GoogleSignInButton
        onSuccess={onSuccess}
        onError={vi.fn()}
        width='320px'
        theme='filled_blue'
      />,
    );

    const button = await screen.findByRole('button', { name: 'Continue with Google' });
    expect(button).toHaveAttribute('data-nonce', 'nonce-one');
    fireEvent.click(button);
    const gisProps = mocks.googleLogin.mock.calls[0][0];
    await act(async () => {
      await gisProps.onSuccess({ credential: 'id-token' });
    });

    expect(onSuccess).toHaveBeenCalledWith({ credential: 'id-token' }, 'nonce-one');
  });

  it('fails closed and lets the user retry after challenge fetch failure', async () => {
    mocks.getGoogleNonce.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(
      'nonce-two',
    );

    render(
      <GoogleSignInButton
        onSuccess={vi.fn()}
        onError={vi.fn()}
        width='320px'
        theme='filled_blue'
      />,
    );

    expect(await screen.findByText(/could not prepare Google sign-in/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toHaveAttribute(
      'data-nonce',
      'nonce-two',
    );
  });

  it('fetches a fresh nonce after an exchange attempt', async () => {
    mocks.getGoogleNonce.mockResolvedValueOnce('nonce-one').mockResolvedValueOnce('nonce-two');
    const onSuccess = vi.fn().mockRejectedValue(new Error('exchange rejected'));

    render(
      <GoogleSignInButton
        onSuccess={onSuccess}
        onError={vi.fn()}
        width='320px'
        theme='filled_blue'
      />,
    );

    const button = await screen.findByRole('button', { name: 'Continue with Google' });
    fireEvent.click(button);
    await act(async () => {
      await mocks.googleLogin.mock.calls[0][0].onSuccess({ credential: 'id-token' });
    });

    await waitFor(() => expect(mocks.getGoogleNonce).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toHaveAttribute(
      'data-nonce',
      'nonce-two',
    );
  });
});
