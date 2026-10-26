import axios from 'axios';
import config from '../config';

export const CSRF_BOOTSTRAP_PATH = '/api/auth/csrf';
export const LOGIN_PATH = '/login';

const AUTH_CHANNEL_NAME = 'dentistdss-auth';
const SESSION_ENDED_MESSAGE = 'session-ended' as const;
const XSRF_HEADER = 'X-XSRF-TOKEN';

export interface BearerSession {
  accessToken: string;
  tokenType: string;
}

export interface SessionTokens {
  accessToken: string;
  tokenType: string;
  [key: string]: unknown;
}

export interface SessionChannel {
  postMessage(message: typeof SESSION_ENDED_MESSAGE): void;
}

export class SessionRefreshSupersededError extends Error {
  override readonly name = 'SessionRefreshSupersededError';

  constructor() {
    super('Session refresh superseded.');
  }
}

export interface BrowserEffects {
  createSessionChannel(
    onMessage: (message: unknown) => void,
  ): SessionChannel | undefined;
  redirectToLogin(): void;
}

interface HeaderBag {
  [key: string]: unknown;
  get?: (name: string) => unknown;
}

interface SessionLifecycle {
  setBearerSession(accessToken: string, tokenType?: string): void;
  getBearerSession(): BearerSession | undefined;
  hasBearerSession(): boolean;
  clearBearerSession(): void;
  getXsrfToken(): string | undefined;
  hasXsrfToken(): boolean;
  clearXsrfToken(): void;
  captureXsrfFromHeaders(headers: unknown): void;
  ensureXsrfBootstrapped(): Promise<void>;
  refreshSession(): Promise<SessionTokens>;
  blockSessionRestore(): void;
  clearLocalSession(): void;
  terminateSession(options: { redirect: boolean }): void;
}

// Bounds the render-adjacent CSRF/refresh chain so an unreachable API cannot
// hold auth bootstrap (and therefore protected-route rendering) indefinitely.
const AUTH_REQUEST_TIMEOUT_MS = 5000;

const rawAuthClient = axios.create({
  baseURL: config.api.baseUrl,
  withCredentials: true,
  timeout: AUTH_REQUEST_TIMEOUT_MS,
});

const readHeader = (headers: unknown, name: string): string | undefined => {
  const headerBag = headers as HeaderBag | undefined;
  const value = headerBag?.get?.(name) ??
    headerBag?.[name] ??
    headerBag?.[name.toLowerCase()];
  return typeof value === 'string' && value.trim() ? value : undefined;
};

const createBrowserEffects = (): BrowserEffects => ({
  createSessionChannel: (onMessage): SessionChannel | undefined => {
    if (typeof BroadcastChannel === 'undefined') {
      return undefined;
    }

    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent): void => {
        onMessage(event.data);
      };
      return {
        postMessage: (message): void => {
          try {
            channel.postMessage(message);
          } catch (_) {
            // Cross-tab lifecycle sync is best-effort.
          }
        },
      };
    } catch (_) {
      return undefined;
    }
  },
  redirectToLogin: (): void => {
    if (typeof window === 'undefined' || window.location.pathname === LOGIN_PATH) {
      return;
    }
    window.location.href = LOGIN_PATH;
  },
});

const SIGNED_OUT_STORAGE_KEY = 'dentistdss-signed-out';

const readSignedOutMarker = (): boolean => {
  try {
    return localStorage.getItem(SIGNED_OUT_STORAGE_KEY) === '1';
  } catch (_) {
    return false;
  }
};

const writeSignedOutMarker = (signedOut: boolean): void => {
  try {
    if (signedOut) {
      localStorage.setItem(SIGNED_OUT_STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(SIGNED_OUT_STORAGE_KEY);
    }
  } catch (_) {
    // The lifecycle still retains the marker in memory when storage is unavailable.
  }
};

const scrubLegacyBearerStorage = (): void => {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenType');
  } catch (_) {
    // Storage may be unavailable; memory-only state still works.
  }
};

export const createSessionLifecycle = (
  browserEffects: BrowserEffects,
): SessionLifecycle => {
  let bearerSession: BearerSession | undefined;
  let xsrfToken: string | undefined;
  let xsrfBootstrapInFlight: Promise<void> | undefined;
  let refreshInFlight: Promise<SessionTokens> | undefined;
  let sessionEpoch = 0;
  let signedOut = readSignedOutMarker();

  const isSessionRestoreBlocked = (): boolean => signedOut || readSignedOutMarker();

  const channel = browserEffects.createSessionChannel((message) => {
    if (message !== SESSION_ENDED_MESSAGE) {
      return;
    }

    const hadBearerSession = bearerSession !== undefined;
    clearLocalSession();
    if (hadBearerSession) {
      browserEffects.redirectToLogin();
    }
  });

  const blockSessionRestore = (): void => {
    signedOut = true;
    sessionEpoch += 1;
    writeSignedOutMarker(true);
  };

  const setBearerSession = (accessToken: string, tokenType: string = 'Bearer'): void => {
    if (!accessToken) {
      return;
    }
    signedOut = false;
    writeSignedOutMarker(false);
    sessionEpoch += 1;
    bearerSession = {
      accessToken,
      tokenType: tokenType || 'Bearer',
    };
  };

  const getBearerSession = (): BearerSession | undefined => bearerSession;
  const hasBearerSession = (): boolean => bearerSession !== undefined;
  const clearBearerSession = (): void => {
    sessionEpoch += 1;
    bearerSession = undefined;
  };
  const getXsrfToken = (): string | undefined => xsrfToken;
  const hasXsrfToken = (): boolean => xsrfToken !== undefined;
  const clearXsrfToken = (): void => {
    sessionEpoch += 1;
    xsrfToken = undefined;
  };

  const captureXsrfFromHeaders = (headers: unknown): void => {
    const responseXsrfToken = readHeader(headers, XSRF_HEADER);
    if (responseXsrfToken) {
      xsrfToken = responseXsrfToken;
    }
  };

  const clearLocalSession = (): void => {
    sessionEpoch += 1;
    bearerSession = undefined;
    xsrfToken = undefined;
  };

  const ensureXsrfBootstrapped = (): Promise<void> => {
    if (xsrfToken || xsrfBootstrapInFlight) {
      return xsrfBootstrapInFlight ?? Promise.resolve();
    }

    const bootstrapEpoch = sessionEpoch;
    xsrfBootstrapInFlight = rawAuthClient
      .get(CSRF_BOOTSTRAP_PATH)
      .then((response) => {
        if (bootstrapEpoch === sessionEpoch) {
          captureXsrfFromHeaders(response.headers);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        xsrfBootstrapInFlight = undefined;
      });

    return xsrfBootstrapInFlight;
  };

  const refreshSession = (): Promise<SessionTokens> => {
    if (isSessionRestoreBlocked()) {
      return Promise.reject(new SessionRefreshSupersededError());
    }
    if (!refreshInFlight) {
      const refreshEpoch = sessionEpoch;
      const refreshWasSuperseded = (): boolean =>
        refreshEpoch !== sessionEpoch || isSessionRestoreBlocked();
      refreshInFlight = (async (): Promise<SessionTokens> => {
        await ensureXsrfBootstrapped();
        if (refreshWasSuperseded()) {
          throw new SessionRefreshSupersededError();
        }
        const response = await rawAuthClient.post(
          '/api/auth/refresh',
          undefined,
          xsrfToken ? { headers: { [XSRF_HEADER]: xsrfToken } } : undefined,
        );
        if (refreshWasSuperseded()) {
          throw new SessionRefreshSupersededError();
        }
        captureXsrfFromHeaders(response.headers);
        const tokens = response.data?.dataObject ?? response.data;
        if (!tokens?.accessToken) {
          throw new Error('Session refresh did not return an access token.');
        }
        if (refreshWasSuperseded()) {
          throw new SessionRefreshSupersededError();
        }
        setBearerSession(tokens.accessToken, tokens.tokenType);
        return tokens as SessionTokens;
      })()
        .catch((error) => {
          if (refreshWasSuperseded()) {
            throw new SessionRefreshSupersededError();
          }
          clearLocalSession();
          throw error;
        })
        .finally(() => {
          refreshInFlight = undefined;
        });
    }
    return refreshInFlight;
  };

  const terminateSession = ({ redirect }: { redirect: boolean }): void => {
    blockSessionRestore();
    clearLocalSession();
    channel?.postMessage(SESSION_ENDED_MESSAGE);
    if (redirect) {
      browserEffects.redirectToLogin();
    }
  };

  return {
    setBearerSession,
    getBearerSession,
    hasBearerSession,
    clearBearerSession,
    getXsrfToken,
    hasXsrfToken,
    clearXsrfToken,
    captureXsrfFromHeaders,
    ensureXsrfBootstrapped,
    refreshSession,
    blockSessionRestore,
    clearLocalSession,
    terminateSession,
  };
};

scrubLegacyBearerStorage();

export const session = createSessionLifecycle(createBrowserEffects());

export const setBearerSession = session.setBearerSession;
export const getBearerSession = session.getBearerSession;
export const hasBearerSession = session.hasBearerSession;
export const clearBearerSession = session.clearBearerSession;
export const getXsrfToken = session.getXsrfToken;
export const hasXsrfToken = session.hasXsrfToken;
export const clearXsrfToken = session.clearXsrfToken;
export const captureXsrfFromHeaders = session.captureXsrfFromHeaders;
export const ensureXsrfBootstrapped = session.ensureXsrfBootstrapped;
export const refreshSession = session.refreshSession;
export const blockSessionRestore = session.blockSessionRestore;
export const clearLocalSession = session.clearLocalSession;
export const terminateSession = session.terminateSession;

export default session;
