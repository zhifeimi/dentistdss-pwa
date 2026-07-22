import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import config from '../config';
import { getHttpErrorMessage } from '../utils/httpErrorMessages';

const XSRF_HEADER = 'X-XSRF-TOKEN';
const XSRF_PROTECTED_AUTH_PATHS = new Set([
  '/api/auth/refresh',
  '/api/auth/logout',
]);
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

type HeaderBag = Record<string, unknown> & {
  delete?: (name: string) => unknown;
  get?: (name: string) => unknown;
  set?: (name: string, value: string) => unknown;
};

let xsrfToken: string | undefined;

// Set the base URL based on environment
const baseURL = config.api.baseUrl;

const readHeader = (headers: unknown, name: string): string | undefined => {
  const headerBag = headers as HeaderBag | undefined;
  const value = headerBag?.get?.(name) ??
    headerBag?.[name] ??
    headerBag?.[name.toLowerCase()];
  return typeof value === 'string' && value.trim() ? value : undefined;
};

const isXsrfProtectedAuthRequest = (request: InternalAxiosRequestConfig): boolean => {
  if (request.method?.toUpperCase() !== 'POST' || !request.url) {
    return false;
  }

  try {
    const endpoint = new URL(request.url, baseURL || window.location.origin);
    if (ABSOLUTE_URL.test(request.url)) {
      if (!baseURL || endpoint.origin !== new URL(baseURL, window.location.origin).origin) {
        return false;
      }
    }
    return XSRF_PROTECTED_AUTH_PATHS.has(endpoint.pathname);
  } catch (_) {
    return XSRF_PROTECTED_AUTH_PATHS.has(request.url.split('?')[0]);
  }
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

// Create an instance of axios with custom configuration
const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// Request interceptor for API calls
api.interceptors.request.use(
  (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('authToken');
    const tokenType = localStorage.getItem('tokenType');
    const headers = request.headers as unknown as HeaderBag;
    const cookieSessionRequest = isXsrfProtectedAuthRequest(request);
    const refreshRequest = request.url?.split('?')[0] === '/api/auth/refresh';

    if (cookieSessionRequest && (refreshRequest || xsrfToken)) {
      removeAuthorizationHeader(headers);
    } else if (token) {
      request.headers.Authorization = `${tokenType} ${token}`;
    }

    removeXsrfHeader(headers);
    if (xsrfToken && cookieSessionRequest) {
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
  (error: AxiosError) => {
    const originalRequest = error.config as any;
    let userMessage = 'An unexpected error occurred.';

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);
      userMessage = getHttpErrorMessage(error.response.status);

      // Handle authentication errors
      if (error.response.status === 401 && !originalRequest._retry) {
        // Remove token and redirect to login if authentication fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenType');
        clearXsrfToken();
        window.location.href = '/login';
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
    const event = new CustomEvent('show-snackbar', {
      detail: {
        message: userMessage,
        severity: 'error',
      },
    });
    window.dispatchEvent(event);

    return Promise.reject(error);
  },
);

// ---- Consolidated API helper objects ----
// Re-create the helper object that used to live in services/apiService.js but now reuses
// the single axios instance defined above. This keeps all API wiring in one place.
// (Previously exported apiService has been merged into dedicated modules like auth.js)

export default api;
