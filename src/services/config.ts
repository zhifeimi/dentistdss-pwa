import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import config from '../config';
import session, { SessionRefreshSupersededError } from './session';
import { getHttpErrorMessage } from '../utils/httpErrorMessages';

// Internal transport requests (XSRF bootstrap, session refresh) fail quietly:
// their callers handle failure explicitly, so the global snackbar is skipped.
declare module 'axios' {
  interface AxiosRequestConfig {
    suppressErrorSnackbar?: boolean;
  }
}

const XSRF_HEADER = 'X-XSRF-TOKEN';
const XSRF_PROTECTED_AUTH_PATHS = new Set([
  '/api/auth/refresh',
  '/api/auth/logout',
]);
// Requests that participate in the cookie session rather than bearer auth.
// The public CSRF bootstrap must never carry a stale bearer, and bearer
// omission on refresh is unconditional; logout keeps the bearer as a JWT
// fallback only while no XSRF token is available.
const COOKIE_SESSION_AUTH_REQUESTS = new Set([
  'POST /api/auth/refresh',
  'POST /api/auth/logout',
  'GET /api/auth/csrf',
]);
// Credential-authenticated routes must never be replayed after a silent
// session refresh: their 401s are credential failures, not expired bearers.
const REFRESH_RETRY_EXCLUDED_PATHS = new Set([
  '/api/auth/login',
  '/oauth2/token',
]);
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

interface HeaderBag {
  [key: string]: unknown;
  delete?: (name: string) => unknown;
  set?: (name: string, value: string) => unknown;
}

// Set the base URL based on environment
const baseURL = config.api.baseUrl;

const authEndpointPathname = (request: InternalAxiosRequestConfig): string | undefined => {
  if (!request.url) {
    return undefined;
  }

  try {
    const endpoint = new URL(request.url, baseURL || window.location.origin);
    if (ABSOLUTE_URL.test(request.url)) {
      if (!baseURL || endpoint.origin !== new URL(baseURL, window.location.origin).origin) {
        return undefined;
      }
    }
    return endpoint.pathname;
  } catch (_) {
    // The base URL is unusable, so an absolute request URL cannot have its
    // origin verified: treat it as foreign rather than risk attaching
    // credentials to it. Only a clearly relative URL is API-bound.
    if (!ABSOLUTE_URL.test(request.url) && request.url.startsWith('/')) {
      return request.url.split('?')[0];
    }
    return undefined;
  }
};

const isXsrfProtectedAuthRequest = (request: InternalAxiosRequestConfig): boolean => {
  if (request.method?.toUpperCase() !== 'POST') {
    return false;
  }
  const pathname = authEndpointPathname(request);
  return pathname !== undefined && XSRF_PROTECTED_AUTH_PATHS.has(pathname);
};

const isCookieSessionAuthRequest = (request: InternalAxiosRequestConfig): boolean => {
  const method = request.method?.toUpperCase();
  if (!method) {
    return false;
  }
  const pathname = authEndpointPathname(request);
  return pathname !== undefined &&
    COOKIE_SESSION_AUTH_REQUESTS.has(`${method} ${pathname}`);
};

const isRefreshRetryEligible = (request: InternalAxiosRequestConfig): boolean => {
  const pathname = authEndpointPathname(request);
  if (pathname === undefined || isCookieSessionAuthRequest(request)) {
    return false;
  }
  return !REFRESH_RETRY_EXCLUDED_PATHS.has(pathname);
};

const removeXsrfHeader = (headers: HeaderBag): void => {
  headers.delete?.(XSRF_HEADER);
  delete headers[XSRF_HEADER];
  delete headers[XSRF_HEADER.toLowerCase()];
};

const removeAuthorizationHeader = (headers: HeaderBag): void => {
  headers.delete?.('Authorization');
  delete headers.Authorization;
  delete headers.authorization;
};

// Create the ordinary Axios instance. Session bootstrap and refresh use the
// raw client owned by session.ts, so they never pass through these interceptors.
const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// Request interceptor for API calls
api.interceptors.request.use(
  (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const bearer = session.getBearerSession();
    const xsrfToken = session.getXsrfToken();
    const sameOriginRequest = authEndpointPathname(request) !== undefined;
    const headers = request.headers as unknown as HeaderBag;
    const cookieSessionRequest = isCookieSessionAuthRequest(request);
    const refreshRequest = request.url?.split('?')[0] === '/api/auth/refresh';
    const csrfBootstrapRequest = request.method?.toUpperCase() === 'GET' &&
      authEndpointPathname(request) === '/api/auth/csrf';

    if (cookieSessionRequest && (refreshRequest || csrfBootstrapRequest || xsrfToken)) {
      removeAuthorizationHeader(headers);
    } else if (!sameOriginRequest) {
      // The bearer is for this API origin only: never leak it (or a
      // caller-supplied Authorization header) to a foreign origin.
      removeAuthorizationHeader(headers);
    } else if (bearer) {
      request.headers.Authorization = `${bearer.tokenType} ${bearer.accessToken}`;
    }

    removeXsrfHeader(headers);
    if (xsrfToken && isXsrfProtectedAuthRequest(request)) {
      if (headers.set) {
        headers.set(XSRF_HEADER, xsrfToken);
      } else {
        headers[XSRF_HEADER] = xsrfToken;
      }
    }

    request.withCredentials = true;
    (request as any).credentials = 'include';
    return request;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse): any => {
    session.captureXsrfFromHeaders(response.headers);

    // Check if the response data and success field exist
    if (response.data && typeof response.data.success !== 'undefined') {
      if (response.data.success) {
        // If there's a success message, optionally show it
        if (response.data.message) {
          const event = new CustomEvent('show-snackbar', {
            detail: {
              message: response.data.message,
              severity: 'success',
            },
          });
          window.dispatchEvent(event);
        }

        // Return the data object if it exists, otherwise return the whole response data
        const result = response.data.dataObject !== undefined
          ? response.data.dataObject
          : response.data;
        return result;
      }

      // If success is false, use the message field for error
      const errorMessage = response.data.message || response.data.dataObject ||
        'An unknown error occurred.';

      // Dispatch a custom event to show the Snackbar
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: errorMessage,
          severity: 'error',
        },
      });
      window.dispatchEvent(event);

      // Reject the promise with the error message
      return Promise.reject(new Error(errorMessage));
    }
    // If the response doesn't match the expected structure, return it as is
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    // Captured before any refresh attempt mutates session state: a 401 only
    // ends (and redirects) a session that actually existed. Anonymous callers
    // stay on the current page.
    const hadSession = session.hasBearerSession();
    const suppressSnackbar = originalRequest?.suppressErrorSnackbar === true;
    let userMessage = 'An unexpected error occurred.';
    let refreshOutcome: 'not-attempted' | 'succeeded' | 'superseded' | 'failed' = 'not-attempted';

    // Expired bearer on a normal API call: attempt one shared, cookie-backed
    // session refresh, then replay the original request with the rotated
    // token. Cookie-session and credential routes are never replayed.
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      isRefreshRetryEligible(originalRequest)
    ) {
      originalRequest._retry = true;
      try {
        await session.refreshSession();
        refreshOutcome = 'succeeded';
      } catch (refreshError) {
        if (refreshError instanceof SessionRefreshSupersededError) {
          originalRequest._refreshSuperseded = true;
          refreshOutcome = 'superseded';
        } else {
          refreshOutcome = 'failed';
        }
        // Refresh failed; fall through to error presentation. A superseded
        // refresh must never replay the original request.
      }
      if (refreshOutcome === 'succeeded') {
        return await api(originalRequest);
      }
    }

    if (error.response) {
      // The request was made and the server responded with a status code that
      // falls out of the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);
      userMessage = getHttpErrorMessage(error.response.status);

      // Handle authentication errors
      if (error.response.status === 401) {
        // Cookie-session endpoints own their failure handling; only a
        // bearer-authenticated request ending a live session broadcasts the
        // end and redirects to login.
        if (
          hadSession &&
          !isCookieSessionAuthRequest(originalRequest) &&
          refreshOutcome !== 'superseded'
        ) {
          session.terminateSession({ redirect: true });
        } else if (refreshOutcome !== 'superseded') {
          session.clearLocalSession();
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
      userMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request that triggered the Error
      console.error('API Error:', error.message);
      userMessage = error.message || userMessage;
    }

    // Dispatch a custom event to show the Snackbar
    if (!suppressSnackbar) {
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: userMessage,
          severity: 'error',
        },
      });
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  },
);

// Narrow compatibility exports for ordinary Axios-era consumers. Session state
// and browser lifecycle behavior remain owned by session.ts; chatbot transport
// imports the concrete singleton directly.
export const setBearerSession = session.setBearerSession;
export const getBearerSession = session.getBearerSession;
export const hasBearerSession = session.hasBearerSession;
export const clearBearerSession = session.clearBearerSession;
export const clearXsrfToken = session.clearXsrfToken;
export const hasXsrfToken = session.hasXsrfToken;
export const ensureXsrfBootstrapped = session.ensureXsrfBootstrapped;
export const refreshSession = session.refreshSession;
const LOGIN_PATH = '/login';
export const redirectToLogin = (): void => {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
};
export const broadcastSessionEnded = (): void => {
  session.terminateSession({ redirect: false });
};

export default api;
