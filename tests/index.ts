/**
 * Test Suite Index
 *
 * Central export file for all test utilities, mocks, and helpers.
 * This file provides a convenient way to import test utilities across the test suite.
 */

import React from 'react';
import { vi } from 'vitest';

// Export test setup and utilities
export * from './setup';

// Type definitions for test utilities
export interface TestCategory {
  description: string;
  path: string;
  pattern: string;
}

export interface TestUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  phone?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
}

export interface TestAppointment {
  id: number;
  patientId: number;
  dentistId: number;
  clinicId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reasonForVisit: string;
  symptoms: string;
  urgencyLevel: string;
  notes: string;
}

export interface TestClinic {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

export interface TestChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface TestAPIResponse {
  status: number;
  data?: any;
  error?: { message: string };
}

export interface TestFixtures {
  users: Record<string, TestUser>;
  appointments: Record<string, TestAppointment>;
  clinics: Record<string, TestClinic>;
  chatMessages: Record<string, TestChatMessage>;
  apiResponses: Record<string, TestAPIResponse>;
}

export interface TestHelpers {
  createMockComponent: (name: string, props?: Record<string, any>) => React.ComponentType<any>;
  createMockApiResponse: (data: any, status?: number) => Response;
  createMockSSEStream: (messages: string[]) => Response;
  waitForElement: (getByTestId: any, testId: string, timeout?: number) => Promise<Element>;
  simulateTyping: (element: Element, text: string, delay?: number) => Promise<void>;
  mockConsole: () => { mocks: Record<string, any>; restore: () => void };
}

export interface TestConfig {
  timeouts: {
    short: number;
    medium: number;
    long: number;
  };
  environment: {
    apiBaseUrl: string;
    frontendUrl: string;
    testUser: TestUser;
  };
  mocks: {
    enableNetworkMocks: boolean;
    enableLocalStorageMocks: boolean;
    enableConsoleMocks: boolean;
  };
}

// Re-export testing library utilities for convenience
export { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
export { vi };
export { describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Test categories and their descriptions
export const testCategories: Record<string, TestCategory> = {
  unit: {
    description: 'Unit tests for individual functions and components',
    path: './unit/',
    pattern: '**/*.test.{js,ts,jsx,tsx}',
  },
  integration: {
    description: 'Integration tests for service interactions and API calls',
    path: './integration/',
    pattern: '**/*.test.{js,ts,jsx,tsx}',
  },
  components: {
    description: 'Component tests for React components and UI interactions',
    path: './components/',
    pattern: '**/*.test.{js,ts,jsx,tsx}',
  },
  utils: {
    description: 'Utility function tests for helper functions and utilities',
    path: './utils/',
    pattern: '**/*.test.{js,ts,jsx,tsx}',
  },
  e2e: {
    description: 'End-to-end tests using Playwright for full user workflows',
    path: './e2e/',
    pattern: '**/*.spec.{js,ts}',
  },
};

// Common test data and fixtures
export const testFixtures: TestFixtures = {
  // User fixtures
  users: {
    patient: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      roles: ['patient'],
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
    },
    dentist: {
      id: 2,
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      email: 'jane.smith@clinic.com',
      roles: ['dentist'],
      phone: '+1234567891',
      licenseNumber: 'DDS12345',
    },
    admin: {
      id: 3,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@clinic.com',
      roles: ['clinic_admin'],
      phone: '+1234567892',
    },
    multiRole: {
      id: 4,
      firstName: 'Multi',
      lastName: 'Role',
      email: 'multi@clinic.com',
      roles: ['dentist', 'clinic_admin'],
      phone: '+1234567893',
    },
  },

  // Appointment fixtures
  appointments: {
    upcoming: {
      id: 1,
      patientId: 1,
      dentistId: 2,
      clinicId: 1,
      appointmentDate: '2024-02-15',
      startTime: '10:00',
      endTime: '11:00',
      status: 'scheduled',
      reasonForVisit: 'Regular checkup',
      symptoms: '',
      urgencyLevel: 'low',
      notes: 'Routine cleaning and examination',
    },
    completed: {
      id: 2,
      patientId: 1,
      dentistId: 2,
      clinicId: 1,
      appointmentDate: '2024-01-15',
      startTime: '14:00',
      endTime: '15:00',
      status: 'completed',
      reasonForVisit: 'Tooth pain',
      symptoms: 'Sharp pain in upper left molar',
      urgencyLevel: 'medium',
      notes: 'Filled cavity in tooth #14',
    },
  },

  // Clinic fixtures
  clinics: {
    main: {
      id: 1,
      name: 'Main Dental Clinic',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'United States',
      phone: '+1234567890',
      email: 'info@maindental.com',
      website: 'https://maindental.com',
    },
  },

  // Chat message fixtures
  chatMessages: {
    userMessage: {
      id: 1,
      type: 'user',
      content: 'Hello, I need help with my appointment',
      timestamp: new Date('2024-01-15T10:00:00Z'),
    },
    aiMessage: {
      id: 2,
      type: 'ai',
      content: 'Hello! I\'d be happy to help you with your appointment. What do you need assistance with?',
      timestamp: new Date('2024-01-15T10:00:05Z'),
    },
    streamingMessage: {
      id: 3,
      type: 'ai',
      content: 'I\'m processing your request...',
      timestamp: new Date('2024-01-15T10:00:10Z'),
      isStreaming: true,
    },
  },

  // API response fixtures
  apiResponses: {
    success: {
      status: 200,
      data: { message: 'Success' },
    },
    error: {
      status: 500,
      error: { message: 'Internal server error' },
    },
    unauthorized: {
      status: 401,
      error: { message: 'Unauthorized' },
    },
    notFound: {
      status: 404,
      error: { message: 'Not found' },
    },
  },
};

// Common test helpers
export const testHelpers: TestHelpers = {
  // Create a mock component for testing
  createMockComponent: (name: string, props: Record<string, any> = {}) => {
    const MockComponent = (componentProps: any) => (
      React.createElement('div', {
        'data-testid': `mock-${name.toLowerCase()}`,
        ...componentProps
      }, `${name} Component`)
    );
    MockComponent.displayName = `Mock${name}`;
    return MockComponent;
  },

  // Create mock API responses
  createMockApiResponse: (data: any, status: number = 200): Response => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  } as Response),

  // Create mock SSE stream
  createMockSSEStream: (messages: string[]): Response => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        messages.forEach((message, index) => {
          setTimeout(() => {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
            if (index === messages.length - 1) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          }, index * 100);
        });
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  },

  // Wait for element to appear
  waitForElement: async (getByTestId: any, testId: string, timeout: number = 5000): Promise<Element> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const element = getByTestId(testId);
        if (element) return element;
      } catch (error) {
        // Element not found yet, continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Element with testId "${testId}" not found within ${timeout}ms`);
  },

  // Simulate user typing
  simulateTyping: async (element: any, text: string, delay: number = 50): Promise<void> => {
    for (const char of text) {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.change(element, {
        target: { value: element.value + char },
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  },

  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    const mockMethods: Record<string, any> = {};

    (['log', 'warn', 'error', 'info', 'debug'] as const).forEach(method => {
      mockMethods[method] = vi.fn();
      (console as any)[method] = mockMethods[method];
    });

    return {
      mocks: mockMethods,
      restore: () => {
        Object.assign(console, originalConsole);
      },
    };
  },
};

// Test configuration
export const testConfig: TestConfig = {
  // Default timeouts
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000,
  },

  // Test environment settings
  environment: {
    apiBaseUrl: 'http://localhost:8080',
    frontendUrl: 'http://localhost:3000',
    testUser: testFixtures.users.patient,
  },

  // Mock settings
  mocks: {
    enableNetworkMocks: true,
    enableLocalStorageMocks: true,
    enableConsoleMocks: false,
  },
};

// Export everything for convenience
export default {
  testCategories,
  testFixtures,
  testHelpers,
  testConfig,
};
