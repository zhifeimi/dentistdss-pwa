import api from './config';
import {
  AuthResponse,
  SignupData,
  User,
  ClinicStaffSignupData,
  ClinicAdminSignupData
} from '../types';

// Helpers to manage auth tokens in localStorage. The request interceptor in
// api/config.js automatically injects these tokens on every request, so all we
// need to do is persist / clear them here.
const storeToken = (accessToken: string, tokenType: string = 'Bearer'): void => {
  if (!accessToken) return;
  localStorage.setItem('authToken', accessToken);
  localStorage.setItem('tokenType', tokenType);
};

const clearToken = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenType');
};

const authAPI = {
  /**
   * Login with email & password — stores token automatically.
   * Returns the object coming from backend (typically { accessToken, tokenType, user })
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const authData = await api.post('/api/auth/login', {email, password}) as AuthResponse;

    // The interceptor unwraps successful responses to `response.message`,
    // so `authData` should already be that object.
    storeToken(authData.accessToken, authData.tokenType);

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
   * Backend logout + local cleanup. Always clears local tokens, even if the
   * network request fails (e.g. expired token).
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (_) {
      // ignore — server might reject due to already invalidated token
    } finally {
      clearToken();
    }
  },

  /**
   * Exchange a Google ID token (obtained on the frontend via Google Identity Services)
   * for an internal JWT issued by our backend. The backend validates the token
   * with Google, creates/logs-in the corresponding account and returns:
   *   { accessToken, tokenType, user }
   * The function stores the returned access token so that subsequent calls to
   * protected endpoints are automatically authenticated.
   */
  async loginWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
    if (!idToken) {
      throw new Error('Missing Google ID token');
    }

    // NOTE: the gateway is configured to accept POST requests at
    //       /login/oauth2/code/google with the ID token in the request body.
    // If your backend expects the token in a different form (e.g. query param
    // or Authorization header) adjust the request accordingly.

    // const authData = await api.post('/login/oauth2/code/google', { idToken });
    const authData = await api.post('/oauth2/token', {idToken}) as AuthResponse;
    // console.log('authData', authData);
    // Persist token locally for future API calls – mirrors the behaviour of
    // the email/password login helper.
    storeToken(authData.accessToken, authData.tokenType);

    return authData;
  },

  // ----- Verification helpers (unchanged) -----
  verifySignupToken: (vtoken: string): Promise<any> => api.get(`/api/auth/signup/verify?vtoken=${vtoken}`),
  verifySignupWithCode: (email: string, code: string, newPassword: string): Promise<any> => api.post('/api/auth/signup/verify/code', {email, code, newPassword}),
  resendVerificationCode: (email: string): Promise<any> => api.post(`/api/auth/signup/verify/code/resend?email=${encodeURIComponent(email)}`),

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
