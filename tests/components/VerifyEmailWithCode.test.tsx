import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localStorageMock } from '../setup';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  verifySignupWithCode: vi.fn(),
  resendVerificationCode: vi.fn(),
  locationState: {
    email: 'patient@example.com',
    firstName: 'Patient',
  } as { email?: string; firstName?: string; approver?: 'clinic' | 'dentistdss'; from?: unknown },
}));

vi.mock('react-router', () => ({
  useLocation: () => ({
    pathname: '/verify-email-code',
    search: '',
    hash: '',
    state: mocks.locationState,
  }),
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../src/services/auth', () => ({
  default: {
    verifySignupWithCode: mocks.verifySignupWithCode,
    resendVerificationCode: mocks.resendVerificationCode,
  },
}));

vi.mock('../../src/components/PasswordStrengthIndicator', () => ({
  default: () => null,
}));

import VerifyEmailWithCodePage from '../../src/pages/VerifyEmail/Code';
import VerifyEmailPage from '../../src/pages/VerifyEmail/Token';

describe('email-code verification security contract', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.verifySignupWithCode.mockReset();
    mocks.resendVerificationCode.mockReset();
    mocks.locationState.email = 'patient@example.com';
    mocks.locationState.firstName = 'Patient';
    delete mocks.locationState.approver;
    delete mocks.locationState.from;
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('submits the mailbox-selected password without persisting it', async () => {
    const user = userEvent.setup();
    mocks.verifySignupWithCode.mockResolvedValue({ success: true });
    render(<VerifyEmailWithCodePage />);

    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.type(screen.getByLabelText('Choose a password'), ['FinalStrong', '1!'].join(''));
    await user.type(screen.getByLabelText('Confirm password'), ['FinalStrong', '1!'].join(''));
    await user.click(screen.getByRole('button', { name: 'Verify email' }));

    await waitFor(() => {
      expect(mocks.verifySignupWithCode).toHaveBeenCalledWith(
        'patient@example.com',
        '123456',
        ['FinalStrong', '1!'].join(''),
      );
    });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it.each([
    {
      who: 'a patient',
      approver: undefined,
      to: ['/login?verified=true', { state: { from: { pathname: '/appointments', search: '?book=7' } } }],
    },
    {
      who: 'clinic staff',
      approver: 'clinic' as const,
      to: ['/pending-approval', { state: { approver: 'clinic', firstName: 'Patient' } }],
    },
    {
      who: 'a clinic admin',
      approver: 'dentistdss' as const,
      to: ['/pending-approval', { state: { approver: 'dentistdss', firstName: 'Patient' } }],
    },
  ])('sends $who to the right next step after verifying', async ({ approver, to }) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      if (approver) mocks.locationState.approver = approver;
      // The page a patient was booking before signing up comes back after login
      else mocks.locationState.from = { pathname: '/appointments', search: '?book=7' };
      mocks.verifySignupWithCode.mockResolvedValue({ success: true });
      render(<VerifyEmailWithCodePage />);

      await user.type(screen.getByLabelText('Verification code'), '123456');
      await user.type(screen.getByLabelText('Choose a password'), ['FinalStrong', '1!'].join(''));
      await user.type(screen.getByLabelText('Confirm password'), ['FinalStrong', '1!'].join(''));
      await user.click(screen.getByRole('button', { name: 'Verify email' }));
      await screen.findByRole('heading', { name: 'Email verified' });

      // The countdown schedules each tick after a re-render
      for (let second = 0; second < 4; second++) {
        await act(() => vi.advanceTimersByTimeAsync(1000));
      }
      expect(mocks.navigate).toHaveBeenCalledWith(...to);
    } finally {
      vi.useRealTimers();
    }
  });

  it('allows verification after route state is lost without storing the password', async () => {
    const user = userEvent.setup();
    delete mocks.locationState.email;
    delete mocks.locationState.firstName;
    mocks.verifySignupWithCode.mockResolvedValue({ success: true });
    render(<VerifyEmailWithCodePage />);

    await user.type(screen.getByLabelText('Email'), 'patient@example.com');
    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.type(screen.getByLabelText('Choose a password'), ['FinalStrong', '1!'].join(''));
    await user.type(screen.getByLabelText('Confirm password'), ['FinalStrong', '1!'].join(''));
    await user.click(screen.getByRole('button', { name: 'Verify email' }));

    await waitFor(() => {
      expect(mocks.verifySignupWithCode).toHaveBeenCalledWith(
        'patient@example.com',
        '123456',
        ['FinalStrong', '1!'].join(''),
      );
    });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('submits the mailbox-selected password from the alternate verification route', async () => {
    const user = userEvent.setup();
    mocks.verifySignupWithCode.mockResolvedValue({ success: true });
    render(<VerifyEmailPage />);

    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.type(screen.getByLabelText('Choose a password'), ['FinalStrong', '1!'].join(''));
    await user.type(screen.getByLabelText('Confirm password'), ['FinalStrong', '1!'].join(''));
    await user.click(screen.getByRole('button', { name: 'Verify email' }));

    await waitFor(() => {
      expect(mocks.verifySignupWithCode).toHaveBeenCalledWith(
        'patient@example.com',
        '123456',
        ['FinalStrong', '1!'].join(''),
      );
    });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('uses a truthful enumeration-safe message when resend returns no payload', async () => {
    const user = userEvent.setup();
    mocks.resendVerificationCode.mockResolvedValue(null);
    render(<VerifyEmailWithCodePage />);

    await user.click(
      screen.getByRole('button', { name: 'Send a new code' }),
    );

    await waitFor(() => {
      expect(mocks.resendVerificationCode).toHaveBeenCalledWith(
        'patient@example.com',
      );
    });
    expect(
      screen.getByText(
        'If verification is available, use your current code or check your email for a code.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('A new verification code has been sent to your email.'),
    ).not.toBeInTheDocument();
  });

  it('keeps verification disabled for weak or mismatched passwords', async () => {
    const user = userEvent.setup();
    render(<VerifyEmailWithCodePage />);

    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.type(screen.getByLabelText('Choose a password'), 'weakpass');
    await user.type(screen.getByLabelText('Confirm password'), 'weakpass');

    const verifyButton = screen.getByRole('button', { name: 'Verify email' });
    expect(verifyButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Choose a password'), {
      target: { value: ['FinalStrong', '1!'].join('') },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'OtherStrong2!' },
    });

    expect(verifyButton).toBeDisabled();
    expect(mocks.verifySignupWithCode).not.toHaveBeenCalled();
  });
});
