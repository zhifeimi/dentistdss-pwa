import api from './config';
import session from './session';
import {
  AuthResponse,
  ClinicAdminSignupData,
  ClinicStaffSignupData,
  SignupData,
  User,
} from '../types';

// The bearer session is owned by the concrete session singleton. The ordinary
// Axios interceptor reads that shared state for same-origin requests, while
// auth methods only set or clear it through session.

const authAPI = {
  /**
   * Login with email & password — stores token automatically.
   * Returns the object coming from backend (typically { accessToken, tokenType, user })
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const authData = await api.post('/api/auth/login', { email, password }) as AuthResponse;

    // The interceptor unwraps successful responses to `response.message`,
    // so `authData` should already be that object.
    session.setBearerSession(authData.accessToken, authData.tokenType);

    return authData; // caller can extract user etc.
  },

  /**
   * Sign-up helper.  Accepts a userData object and returns the unwrapped
   * response from the backend (handled by interceptor).
   */
  async signup(userData: SignupData): Promise<any> {
    return api.post('/api/auth/signup', userData);
  },

  /**
   * Verifies an existing session/token and returns the user profile if valid.
   */
  async me(): Promise<User> {
    const response = await api.get('/api/auth/me');
    // Extract user data from response - handle both wrapped and direct responses
    return response.data || response;
  },

  /**
   * Fetches a readable XSRF token from the API origin for cookie-authenticated
   * refresh and logout requests. The Axios response interceptor retains it only
   * in memory.
   */
  async bootstrapXsrf(): Promise<void> {
    await session.ensureXsrfBootstrapped();
  },

  /**
   * Best-effort, single-flight XSRF bootstrap; never rejects. Call before any
   * cookie-session request that must survive a page reload.
   */
  ensureXsrfBootstrapped: session.ensureXsrfBootstrapped,

  /**
   * Rotates the HttpOnly refresh cookie and stores the resulting access token.
   * Delegates to the shared single-flight transport refresh, which clears
   * local session state and rethrows on failure.
   */
  async refresh(): Promise<AuthResponse> {
    // The transport types the narrow token contract; the unwrapped backend
    // payload is the full AuthResponse (tokens + user).
    return (await session.refreshSession()) as unknown as AuthResponse;
  },

  /**
   * Blocks cookie-session restoration immediately, then attempts backend logout.
   * Always clears local credentials and notifies other tabs, even if logout fails.
   */
  async logout(): Promise<void> {
    session.blockSessionRestore();
    try {
      await session.ensureXsrfBootstrapped();
      await api.post('/api/auth/logout', undefined, { suppressErrorSnackbar: true });
    } catch (_) {
      // ignore — server might reject due to already invalidated token
    } finally {
      session.terminateSession({ redirect: false });
    }
  },

  /** Fetch a one-time nonce challenge before rendering Google Identity Services. */
  async getGoogleNonce(): Promise<string> {
    const response = await api.get('/oauth2/nonce') as { nonce?: string };
    if (!response?.nonce) {
      throw new Error('Unable to prepare Google sign-in. Please retry.');
    }
    return response.nonce;
  },

  /**
   * Exchange a Google ID token (obtained on the frontend via Google Identity Services)
   * for an internal JWT issued by our backend. The backend validates the token
   * with Google, creates/logs-in the corresponding account and returns:
   *   { accessToken, tokenType, user }
   * The function stores the returned access token so that subsequent calls to
   * protected endpoints are automatically authenticated.
   */
  async loginWithGoogleIdToken(idToken: string, nonce: string): Promise<AuthResponse> {
    if (!idToken) {
      throw new Error('Missing Google ID token');
    }
    if (!nonce) {
      throw new Error('Missing Google sign-in nonce');
    }

    const authData = await api.post('/oauth2/token', { idToken, nonce }) as AuthResponse;
    // Persist the bearer in memory for future API calls – mirrors the behaviour
    // of the email/password login helper.
    session.setBearerSession(authData.accessToken, authData.tokenType);

    return authData;
  },

  // ----- Verification helpers (unchanged) -----
  verifySignupToken: (vtoken: string): Promise<any> =>
    api.get(`/api/auth/signup/verify?vtoken=${vtoken}`),
  verifySignupWithCode: (email: string, code: string, newPassword: string): Promise<any> =>
    api.post('/api/auth/signup/verify/code', { email, code, newPassword }),
  resendVerificationCode: (email: string): Promise<any> =>
    api.post(`/api/auth/signup/verify/code/resend?email=${encodeURIComponent(email)}`),

  async signupClinicAdmin(clinicAdminData: ClinicAdminSignupData): Promise<any> {
    // Registers a new dental clinic together with its administrator account.
    // Expects the backend to return a success message indicating that the
    // verification email was sent and the registration is pending approval.
    return api.post('/api/auth/signup/clinic/admin', clinicAdminData);
  },

  async signupClinicStaff(clinicStaffData: ClinicStaffSignupData): Promise<any> {
    // Registers a new dental clinic staff member (dentist, receptionist, etc.)
    // Expects the backend to return a success message indicating that the
    // verification email was sent and the registration is pending approval.
    return api.post('/api/auth/signup/clinic/staff', clinicStaffData);
  },

  /**
   * Change user password
   * @param newPassword - The new password
   * @returns Response from the backend
   */
  async changePassword(newPassword: string): Promise<any> {
    return api.post('/api/auth/password/change', { newPassword });
  },
};

export default authAPI;
