import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClinicAdminSignupData } from '../../src/types';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  refreshSession: vi.fn(),
  ensureXsrfBootstrapped: vi.fn(() => Promise.resolve()),
  setBearerSession: vi.fn(),
  terminateSession: vi.fn(),
}));

vi.mock('../../src/services/config', () => ({
  default: {
    post: mocks.post,
    get: mocks.get,
  },
}));

vi.mock('../../src/services/session', () => ({
  default: {
    refreshSession: mocks.refreshSession,
    ensureXsrfBootstrapped: mocks.ensureXsrfBootstrapped,
    setBearerSession: mocks.setBearerSession,
    terminateSession: mocks.terminateSession,
  },
}));

import authAPI from '../../src/services/auth';
import clinicAPI from '../../src/services/clinic';
import dictionary from '../../src/utils/dictionary';
import { calculatePasswordStrength, isPasswordStrong } from '../../src/utils/passwordStrength';

describe('auth onboarding API contracts', () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.get.mockReset();
    mocks.refreshSession.mockReset();
    mocks.ensureXsrfBootstrapped.mockReset();
    mocks.setBearerSession.mockReset();
    mocks.terminateSession.mockReset();
  });

  it('sends the mailbox-selected password with code verification', async () => {
    mocks.post.mockResolvedValue({ success: true });

    await authAPI.verifySignupWithCode(
      'patient@example.com',
      '123456',
      ['FinalStrong', '1!'].join(''),
    );

    expect(mocks.post).toHaveBeenCalledWith('/api/auth/signup/verify/code', {
      email: 'patient@example.com',
      code: '123456',
      newPassword: ['FinalStrong', '1!'].join(''),
    });
  });

  it('uses exact auth routes for XSRF bootstrap and delegates refresh to the transport', async () => {
    mocks.get.mockResolvedValue({});
    mocks.refreshSession.mockResolvedValue({
      accessToken: 'access-token',
      tokenType: 'Bearer',
    });

    await authAPI.bootstrapXsrf();
    const result = await authAPI.refresh();

    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.ensureXsrfBootstrapped).toHaveBeenCalledTimes(1);
    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access-token');
  });

  it('URL-encodes mailbox aliases when resending a code', async () => {
    mocks.post.mockResolvedValue({ success: true });

    await authAPI.resendVerificationCode('patient+clinic@example.com');

    expect(mocks.post).toHaveBeenCalledWith(
      '/api/auth/signup/verify/code/resend?email=patient%2Bclinic%40example.com',
    );
  });

  it('matches the backend password policy before verification', () => {
    expect(isPasswordStrong(['FinalStrong', '1!'].join(''))).toBe(true);
    expect(
      isPasswordStrong(
        Array.from({ length: 12 }, (_, index) => String.fromCharCode(97 + index)).join('') + '1!',
      ),
    ).toBe(false);
    expect(isPasswordStrong('Final Strong1!')).toBe(false);
    expect(isPasswordStrong(`Aa1!${'x'.repeat(125)}`)).toBe(false);
    expect(calculatePasswordStrength(['FinalStrong', '1!'].join('')).level).toBe('strong');
    expect(calculatePasswordStrength(['LongPassword', '123'].join('')).level).not.toBe(
      'strong',
    );
    expect(calculatePasswordStrength('Final Strong1!').level).not.toBe(
      'strong',
    );
  });

  it('keeps both verification routes public', () => {
    expect(dictionary.locations.public).toContain('/verify-email-code');
    expect(dictionary.locations.public).toContain('/signup/verify');
  });

  it('keeps the bearer in module memory across login and logout', async () => {
    mocks.post.mockResolvedValueOnce({
      accessToken: 'login-token',
      tokenType: 'Bearer',
      user: { id: 1, email: 'patient@example.com' },
    });

    await authAPI.login('patient@example.com', ['FinalStrong', '1!'].join(''));

    expect(mocks.setBearerSession).toHaveBeenCalledWith('login-token', 'Bearer');
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('tokenType')).toBeNull();

    mocks.post.mockResolvedValueOnce({});
    await authAPI.logout();

    expect(mocks.post).toHaveBeenCalledWith('/api/auth/logout', undefined, {
      suppressErrorSnackbar: true,
    });
    expect(mocks.terminateSession).toHaveBeenCalledWith({ redirect: false });
  });

  it('loads the public clinic list from the gateway route', async () => {
    mocks.get.mockResolvedValue([]);

    await clinicAPI.getClinics();

    expect(mocks.get).toHaveBeenCalledWith('/api/clinic/list/all');
  });

  it('uses the backend clinic-admin field names without aliases', async () => {
    const payload: ClinicAdminSignupData = {
      firstName: 'Clinic',
      lastName: 'Owner',
      email: 'owner@example.com',
      password: ['FinalStrong', '1!'].join(''),
      role: 'CLINIC_ADMIN',
      clinicName: 'Owner Dental',
      address: '1 Main Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'United States',
      phoneNumber: '+15125550123',
      businessEmail: 'office@example.com',
      website: 'https://example.com',
    };
    mocks.post.mockResolvedValue({ success: true });

    await authAPI.signupClinicAdmin(payload);

    expect(mocks.post).toHaveBeenCalledWith(
      '/api/auth/signup/clinic/admin',
      payload,
    );
    expect(payload).not.toHaveProperty('clinicAddress');
    expect(payload).not.toHaveProperty('clinicEmail');
    expect(payload).not.toHaveProperty('clinicWebsite');
  });
});
