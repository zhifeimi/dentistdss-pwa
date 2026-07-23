import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import config from '../config';
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
export const CSRF_BOOTSTRAP_PATH = '/api/auth/csrf';
// Credential-authenticated routes must never be replayed after a silent
// session refresh: their 401s are credential failures, not expired bearers.
const REFRESH_RETRY_EXCLUDED_PATHS = new Set([
  '/api/auth/login',
  '/oauth2/token',
]);
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

type HeaderBag = Record<string, unknown> & {
  delete?: (name: string) => unknown;
  get?: (name: string) => unknown;
  set?: (name: string, value: string) => unknown;
};

let xsrfToken: string | undefined;

export interface BearerSession {
  accessToken: string;
  tokenType: string;
}

// The access token lives only in module memory: it never touches web storage,
// so it cannot be read by injected scripts via localStorage scraping and it
// dies with the tab. A page reload restores it from the HttpOnly refresh
// cookie via refreshSession().
let bearerSession: BearerSession | undefined;

// Set the base URL based on environment
const baseURL = config.api.baseUrl;

// Legacy migration: the bearer used to persist in localStorage. Scrub any
// stale copy on load so access tokens no longer linger in web storage.
try {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenType');
} catch (_) {
  // Storage may be unavailable (e.g. private mode); nothing else to do.
}

export const setBearerSession = (accessToken: string, tokenType: string = 'Bearer'): void => {
  if (!accessToken) {
    return;
  }
  bearerSession = { accessToken, tokenType: tokenType || 'Bearer' };
};

export const getBearerSession = (): BearerSession | undefined => bearerSession;

export const hasBearerSession = (): boolean => bearerSession !== undefined;

export const clearBearerSession = (): void => {
  bearerSession = undefined;
};

export const LOGIN_PATH = '/login';

export const redirectToLogin = (): void => {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
};

// Cross-tab session lifecycle sync. Only lifecycle events are ever broadcast
// — never tokens. A new tab restores its own bearer from the refresh cookie.
const AUTH_CHANNEL_NAME = 'dentistdss-auth';
const SESSION_ENDED_MESSAGE = 'session-ended';

let authChannel: BroadcastChannel | undefined;

try {
  if (typeof BroadcastChannel !== 'undefined') {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    authChannel.onmessage = (event: MessageEvent): void => {
      if (event.data !== SESSION_ENDED_MESSAGE || !hasBearerSession()) {
        return;
      }
      // Another tab ended the shared cookie session (logout or terminal 401):
      // the server-side family is already revoked, so drop local state too.
      clearBearerSession();
      clearXsrfToken();
      redirectToLogin();
    };
  }
} catch (_) {
  authChannel = undefined;
}

export const broadcastSessionEnded = (): void => {
  try {
    authChannel?.postMessage(SESSION_ENDED_MESSAGE);
  } catch (_) {
    // The channel may be closed or unavailable; cross-tab sync is best-effort.
  }
};

const readHeader = (headers: unknown, name: string): string | undefined => {
  const headerBag = headers as HeaderBag | undefined;
  const value = headerBag?.get?.(name) ??
    headerBag?.[name] ??
    headerBag?.[name.toLowerCase()];
  return typeof value === 'string' && value.trim() ? value : undefined;
};

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

export const clearXsrfToken = (): void => {
  xsrfToken = undefined;
};

export const hasXsrfToken = (): boolean => xsrfToken !== undefined;

// Create an instance of axios with custom configuration
const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

let xsrfBootstrapInFlight: Promise<void> | undefined;

/**
 * Best-effort, single-flight bootstrap of the in-memory XSRF token from the
 * API origin (module state is lost on every page reload). Shared across
 * concurrent callers and React StrictMode double-effects. Never rejects: a
 * failed bootstrap is expected offline, and the subsequent cookie-session
 * request fails closed on its own.
 */
export const ensureXsrfBootstrapped = (): Promise<void> => {
  if (xsrfToken !== undefined) {
    return Promise.resolve();
  }
  if (!xsrfBootstrapInFlight) {
    xsrfBootstrapInFlight = api
      .get(CSRF_BOOTSTRAP_PATH, { suppressErrorSnackbar: true })
      .then((): void => undefined)
      .catch((): void => undefined)
      .finally(() => {
        xsrfBootstrapInFlight = undefined;
      });
  }
  return xsrfBootstrapInFlight;
};

export interface SessionTokens {
  accessToken: string;
  tokenType: string;
  [key: string]: unknown;
}

let refreshInFlight: Promise<SessionTokens> | undefined;

/**
 * Single-flight cookie-backed session refresh: bootstraps XSRF, rotates the
 * HttpOnly refresh cookie via POST /api/auth/refresh, and stores the returned
 * access token in module memory. Clears local session state and rethrows on
 * failure. Concurrent callers share one rotation — important because refresh
 * tokens are one-use.
 */
export const refreshSession = (): Promise<SessionTokens> => {
  if (!refreshInFlight) {
    refreshInFlight = (async (): Promise<SessionTokens> => {
      await ensureXsrfBootstrapped();
      const authData = await api.post(
        '/api/auth/refresh',
        undefined,
        { suppressErrorSnackbar: true },
      ) as SessionTokens | undefined;
      if (!authData || !authData.accessToken) {
        throw new Error('Session refresh did not return an access token.');
      }
      setBearerSession(authData.accessToken, authData.tokenType);
      return authData;
    })()
      .catch((error) => {
        clearBearerSession();
        clearXsrfToken();
        throw error;
      })
      .finally(() => {
        refreshInFlight = undefined;
      });
  }
  return refreshInFlight;
};

// Request interceptor for API calls
api.interceptors.request.use(
  (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const bearer = getBearerSession();
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
    const responseXsrfToken = readHeader(response.headers, XSRF_HEADER);
    if (responseXsrfToken) {
      xsrfToken = responseXsrfToken;
    }

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
    const hadSession = hasBearerSession();
    const suppressSnackbar = originalRequest?.suppressErrorSnackbar === true;
    let userMessage = 'An unexpected error occurred.';

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
        await refreshSession();
        return await api(originalRequest);
      } catch (_) {
        // Refresh failed; fall through to terminal session handling.
      }
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);
      userMessage = getHttpErrorMessage(error.response.status);

      // Handle authentication errors
      if (error.response.status === 401) {
        clearBearerSession();
        clearXsrfToken();
        // Cookie-session endpoints (refresh/logout/csrf bootstrap) own their
        // failure handling; only a bearer-authenticated request ending a live
        // session broadcasts the end and redirects to login.
        if (hadSession && !isCookieSessionAuthRequest(originalRequest)) {
          broadcastSessionEnded();
          redirectToLogin();
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

// ---- Consolidated API helper objects ----
// Re-create the helper object that used to live in services/apiService.js but now reuses
// the single axios instance defined above. This keeps all API wiring in one place.
// (Previously exported apiService has been merged into dedicated modules like auth.js)

export default api;
