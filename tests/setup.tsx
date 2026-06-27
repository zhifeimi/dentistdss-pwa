/**
 * Test Setup Configuration
 *
 * This file configures the testing environment for the dental clinic assistant system.
 * It sets up global mocks, test utilities, and environment configuration.
 */

import { vi, type MockedFunction } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';

// Type definitions for test environment
declare global {
  interface Window {
    localStorage: Storage;
    sessionStorage: Storage;
    dispatchEvent: MockedFunction<(event: Event) => boolean>;
    matchMedia: MockedFunction<(query: string) => MediaQueryList>;
  }

  namespace NodeJS {
    interface Global {
      fetch: MockedFunction<typeof fetch>;
      console: Console & {
        log: MockedFunction<typeof console.log>;
      };
      IntersectionObserver: MockedFunction<typeof IntersectionObserver>;
      ResizeObserver: MockedFunction<typeof ResizeObserver>;
      google: any;
    }
  }
}

// Global test configuration
(global as any).console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_HOST: 'http://localhost',
  VITE_API_PORT: '8080',
  VITE_API_ROOT_PATH: '',
  VITE_API_AUTH_PATH: '/auth',
  VITE_API_OAUTH_PATH: '/oauth',
  VITE_API_GENAI_PATH: '/genai',
  VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
  VITE_GOOGLE_MAPS_API_KEY: 'test-google-maps-key',
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string): string | null => store[key] || null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
    get length(): number {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number): string | null => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string): string | null => store[key] || null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock window.dispatchEvent for custom events
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
});

// Mock fetch globally
(global as any).fetch = vi.fn();

// Mock IntersectionObserver
(global as any).IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
(global as any).ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

// Mock Google Maps API
(global as any).google = {
  maps: {
    Map: vi.fn(),
    Marker: vi.fn(),
    InfoWindow: vi.fn(),
    LatLng: vi.fn(),
    places: {
      PlacesService: vi.fn(),
      AutocompleteService: vi.fn(),
    },
    geometry: {
      spherical: {
        computeDistanceBetween: vi.fn(),
      },
    },
  },
};

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Link: ({ children, to, ...props }) => {
    return React.createElement('a', { href: to, ...props }, children);
  },
  NavLink: ({ children, to, ...props }) => {
    return React.createElement('a', { href: to, ...props }, children);
  },
}));

// Mock Material-UI theme
vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      error: { main: '#f44336' },
      warning: { main: '#ff9800' },
      info: { main: '#2196f3' },
      success: { main: '#4caf50' },
    },
    breakpoints: {
      up: vi.fn(() => '@media (min-width:600px)'),
      down: vi.fn(() => '@media (max-width:599px)'),
    },
    spacing: vi.fn((factor) => `${8 * factor}px`),
  }),
  createTheme: vi.fn(() => ({})),
  ThemeProvider: ({ children }) => children,
}));

// Type definitions for test utilities
interface MockUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  [key: string]: any;
}

interface MockAuthData {
  mockUser: MockUser;
  mockToken: string;
}

// Test utilities
export const testUtils = {
  // Create mock user data
  createMockUser: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    roles: ['patient'],
    ...overrides,
  }),

  // Create mock auth token
  createMockAuthToken: (): string => 'mock-jwt-token',

  // Create mock SSE response
  createMockSSEResponse: (data: string | string[]): Response => {
    const sseData = Array.isArray(data) ? data : [data];
    const sseContent = sseData.map(item => `data: ${item}\n\n`).join('');

    return new Response(sseContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  },

  // Create mock streaming response
  createMockStreamingResponse: (chunks: string[]): Response => {
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach(chunk => {
          controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
        });
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  },

  // Setup authentication mocks
  setupAuthMocks: (user: MockUser | null = null): MockAuthData => {
    const mockUser = user || testUtils.createMockUser();
    const mockToken = testUtils.createMockAuthToken();

    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'authToken':
          return mockToken;
        case 'tokenType':
          return 'Bearer';
        case 'userData':
          return JSON.stringify(mockUser);
        default:
          return null;
      }
    });

    return { mockUser, mockToken };
  },

  // Clear all mocks
  clearAllMocks: (): void => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    (fetch as any).mockClear();
    mockDispatchEvent.mockClear();
  },

  // Wait for async operations
  waitFor: (ms: number = 0): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),
};

// Export mocks for use in tests
export {
  localStorageMock,
  sessionStorageMock,
  mockDispatchEvent,
};

// Global test cleanup
afterEach(() => {
  testUtils.clearAllMocks();
});
