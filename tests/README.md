# Test Suite Documentation

This directory contains all test files for the Dental Clinic Assistant System. The tests are organized by category and type to ensure comprehensive coverage and maintainability.

**🔥 All tests are now written in TypeScript for enhanced type safety and better development experience!**

## Directory Structure

```
tests/
├── README.md                 # This file
├── index.ts                  # Test utilities and exports (TypeScript)
├── setup.tsx                 # Global test configuration and mocks (TypeScript)
├── tsconfig.json             # TypeScript configuration for tests
├── unit/                     # Unit tests for individual functions
│   └── javascript.test.ts    # JavaScript fundamentals tests (TypeScript)
├── integration/              # Integration tests for services and APIs
│   └── chatbot.test.ts       # Chatbot service integration tests (TypeScript)
├── components/               # React component tests
│   └── components.test.tsx   # Basic React component tests (TypeScript)
├── utils/                    # Utility function tests
│   ├── utilities.test.ts     # Dashboard and dictionary utilities (TypeScript)
│   └── sseUtils.test.ts      # SSE processing utilities tests (TypeScript)
└── e2e/                      # End-to-end tests (Playwright)
    ├── basic-dashboard.spec.ts
    └── dashboard-roles-fixed.spec.ts
```

## Test Categories

### 🔧 Unit Tests (`/unit/`)
Tests for individual functions, utilities, and isolated components.

**Purpose**: Verify that individual units of code work correctly in isolation.

**Examples**:
- Pure function testing
- Type validation
- Algorithm testing
- Data transformation

**Run**: `deno task test:unit`

### 🔗 Integration Tests (`/integration/`)
Tests for service interactions, API calls, and component integration.

**Purpose**: Verify that different parts of the system work together correctly.

**Examples**:
- API service testing
- Database interactions
- External service integration
- Component communication

**Run**: `deno task test:integration`

### 🎨 Component Tests (`/components/`)
Tests for React components, UI interactions, and rendering.

**Purpose**: Verify that UI components render correctly and handle user interactions.

**Examples**:
- Component rendering
- Props handling
- Event handling
- State management

**Run**: `deno task test:components`

### 🛠 Utility Tests (`/utils/`)
Tests for helper functions, utilities, and shared code.

**Purpose**: Verify that utility functions work correctly across different scenarios.

**Examples**:
- Data formatting
- Validation functions
- Helper utilities
- Configuration processing

**Run**: `deno task test:utils`

### 🌐 End-to-End Tests (`/e2e/`)
Full user workflow tests using Playwright.

**Purpose**: Verify that complete user workflows work correctly in a real browser environment.

**Examples**:
- User authentication flows
- Dashboard navigation
- Appointment booking
- Chat interactions

**Run**: `deno task test:e2e`

## Test Configuration

### Global Setup (`setup.tsx`)
- Configures testing environment with TypeScript support
- Sets up global mocks (localStorage, fetch, etc.) with proper typing
- Provides test utilities and helpers with type safety
- Configures Material-UI and React Router mocks

### Test Utilities (`index.ts`)
- Exports common testing utilities with TypeScript types
- Provides test fixtures and mock data with type definitions
- Includes helper functions for testing with proper typing
- Centralizes test configuration with TypeScript support

## Running Tests

### All Tests
```bash
deno task test
```

### Specific Categories
```bash
deno task test:unit          # Unit tests only
deno task test:integration   # Integration tests only
deno task test:components    # Component tests only
deno task test:utils         # Utility tests only
```

### Watch Mode
```bash
deno task test:watch
```

### Coverage Report
```bash
deno task test:coverage
```

### End-to-End Tests
```bash
deno task test:e2e
```

## Writing Tests

### Test File Naming
- Unit tests: `*.test.ts` (TypeScript)
- Component tests: `*.test.tsx` (TypeScript with JSX)
- E2E tests: `*.spec.ts` (TypeScript)

### Test Structure
```typescript
import { describe, it, expect, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { testUtils } from '../index';

describe('Feature Name', () => {
  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input: string = 'test input';

      // Act
      const result: string = functionUnderTest(input);

      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Using Test Utilities
```typescript
import { testUtils, testFixtures } from '../index';
import type { TestUser, MockAuthData } from '../index';

// Use mock user data with proper typing
const mockUser: TestUser = testFixtures.users.patient;

// Setup authentication with typed return
const { mockUser, mockToken }: MockAuthData = testUtils.setupAuthMocks();

// Create mock API response with typing
const mockResponse: Response = testUtils.createMockApiResponse({ success: true });

// Create mock SSE stream with typed parameters
const mockStream: Response = testUtils.createMockSSEStream(['Hello', 'world']);
```

### Mocking Guidelines

#### API Calls
```javascript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'mock data' }),
});
```

#### React Components
```javascript
// Mock a component
vi.mock('../components/MyComponent', () => ({
  default: ({ children, ...props }) => (
    <div data-testid="mock-my-component" {...props}>
      {children}
    </div>
  ),
}));
```

#### Services
```javascript
// Mock a service
vi.mock('../services/api', () => ({
  chatbot: {
    send: vi.fn().mockResolvedValue({ kind: 'completed', text: 'mock response' }),
  },
}));
```

## Test Data and Fixtures

### User Fixtures
```javascript
import { testFixtures } from './index.js';

const patient = testFixtures.users.patient;
const dentist = testFixtures.users.dentist;
const admin = testFixtures.users.admin;
```

### API Response Fixtures
```javascript
const successResponse = testFixtures.apiResponses.success;
const errorResponse = testFixtures.apiResponses.error;
```

### Chat Message Fixtures
```javascript
const userMessage = testFixtures.chatMessages.userMessage;
const aiMessage = testFixtures.chatMessages.aiMessage;
```

## Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern (Arrange, Act, Assert)

### 2. Mocking Strategy
- Mock external dependencies (APIs, services, libraries)
- Use real implementations for internal utilities when possible
- Keep mocks simple and focused

### 3. Test Data
- Use test fixtures for consistent test data
- Avoid hardcoded values in tests
- Create realistic but minimal test data

### 4. Assertions
- Use specific assertions (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Verify error conditions and edge cases

### 5. Cleanup
- Clean up mocks and state after each test
- Use `beforeEach` and `afterEach` for setup and cleanup
- Avoid test interdependencies

## Common Testing Patterns

### Testing Async Functions
```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Handling
```javascript
it('should handle errors gracefully', async () => {
  const mockError = new Error('Test error');
  fetch.mockRejectedValue(mockError);
  
  await expect(functionThatCallsFetch()).rejects.toThrow('Test error');
});
```

### Testing React Components
```javascript
import { render, screen } from '@testing-library/react';

it('should render component correctly', () => {
  render(<MyComponent prop="value" />);
  
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Testing User Interactions
```javascript
import { fireEvent } from '@testing-library/react';

it('should handle user clicks', () => {
  const mockHandler = vi.fn();
  render(<Button onClick={mockHandler}>Click me</Button>);
  
  fireEvent.click(screen.getByText('Click me'));
  expect(mockHandler).toHaveBeenCalledTimes(1);
});
```

## Debugging Tests

### Console Output
```javascript
// Enable console output for debugging
console.log('Debug info:', debugData);
```

### Test Isolation
```javascript
// Run a single test
npm test -- --run specific.test.js

// Run tests matching a pattern
npm test -- --run --grep "specific test name"
```

### Coverage Analysis
```javascript
// Generate detailed coverage report
npm test -- --coverage --reporter=html
```

## Continuous Integration

The test suite is configured to run in CI/CD pipelines with:
- Automated test execution on pull requests
- Coverage reporting and thresholds
- E2E test execution in headless browsers
- Test result reporting and notifications

## Contributing

When adding new features:
1. Write tests for new functionality
2. Update existing tests if behavior changes
3. Ensure all tests pass before submitting
4. Add appropriate test documentation
5. Follow the established testing patterns and conventions
