import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import chatbotAPI from '../../src/services/chatbot';
import { clearBearerSession, setBearerSession } from '../../src/services/config';
import type { TokenCallback } from '../../src/utils/sseUtils';

// Type definitions for mocks
interface MockLocalStorage {
  getItem: MockedFunction<(key: string) => string | null>;
  setItem: MockedFunction<(key: string, value: string) => void>;
  removeItem: MockedFunction<(key: string) => void>;
  clear: MockedFunction<() => void>;
}

// Mock the enhanced SSE reader
vi.mock('../../src/utils/sseUtils', () => ({
  createEnhancedSSEReader: vi.fn(),
  formatSSEError: vi.fn((error: Error, endpoint: string) => `SSE error for ${endpoint}: ${error.message}`)
}));

// Mock fetch globally
(global as any).fetch = vi.fn();

// Mock localStorage
const localStorageMock: MockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.dispatchEvent
const mockDispatchEvent: MockedFunction<(event: Event) => boolean> = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent
});

describe('Chatbot API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the in-memory bearer session
    clearBearerSession();

    // Reset localStorage mocks
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});

    // Reset fetch mock
    (fetch as MockedFunction<typeof fetch>).mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('help endpoint', () => {
    it('should call help endpoint without authentication', async () => {
      const mockResponse: Response = new Response('data: Hello\n\ndata: world\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' }
      });

      (fetch as MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);
      
      const { createEnhancedSSEReader } = await import('../../src/utils/sseUtils');
      (createEnhancedSSEReader as MockedFunction<typeof createEnhancedSSEReader>).mockResolvedValue('Hello world');

      const callback: MockedFunction<TokenCallback> = vi.fn();
      const result: string = await chatbotAPI.help('Test message', callback);

      expect(fetch as MockedFunction<typeof fetch>).toHaveBeenCalledWith(
        expect.stringContaining('/api/genai/chatbot/help'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'text/plain',
            'Accept': 'text/event-stream'
          }),
          body: 'Test message'
        })
      );
      
      expect(createEnhancedSSEReader).toHaveBeenCalledWith(mockResponse, callback);
      expect(result).toBe('Hello world');
    });

    it('should handle help endpoint errors', async () => {
      const error: Error = new Error('Network error');
      (fetch as MockedFunction<typeof fetch>).mockRejectedValue(error);

      const callback: MockedFunction<TokenCallback> = vi.fn();
      
      await expect(chatbotAPI.help('Test message', callback)).rejects.toThrow('Network error');
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-snackbar',
          detail: expect.objectContaining({
            severity: 'error'
          })
        })
      );
    });
  });

  describe('authenticated endpoints', () => {
    beforeEach(() => {
      // Seed the in-memory bearer session shared with the axios transport
      setBearerSession('mock-jwt-token', 'Bearer');
    });

    describe('aidentist endpoint', () => {
      it('should call aidentist endpoint with authentication', async () => {
        const mockResponse: Response = new Response('data: Clinical response\n\n', {
          status: 200,
          headers: { 'content-type': 'text/event-stream' }
        });

        (fetch as MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);
        
        const { createEnhancedSSEReader } = await import('../../src/utils/sseUtils');
        (createEnhancedSSEReader as MockedFunction<typeof createEnhancedSSEReader>).mockResolvedValue('Clinical response');

        const callback: MockedFunction<TokenCallback> = vi.fn();
        const result: string = await chatbotAPI.aidentist('Clinical question', callback);

        expect(fetch as MockedFunction<typeof fetch>).toHaveBeenCalledWith(
          expect.stringContaining('/api/genai/chatbot/aidentist'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            }),
            body: 'Clinical question'
          })
        );
        
        expect(result).toBe('Clinical response');
      });

      it('should reject aidentist request without authentication', async () => {
        clearBearerSession();

        const callback: MockedFunction<TokenCallback> = vi.fn();
        
        await expect(chatbotAPI.aidentist('Clinical question', callback)).rejects.toThrow(
          'Authentication required to access the AI Dentist'
        );
        
        expect(callback).toHaveBeenCalledWith(
          expect.stringContaining('Authentication required'),
          expect.stringContaining('Authentication required')
        );
      });
    });

    describe('receptionist endpoint', () => {
      it('should call receptionist endpoint with authentication', async () => {
        const mockResponse = new Response('data: Receptionist response\n\n', {
          status: 200,
          headers: { 'content-type': 'text/event-stream' }
        });
        
        fetch.mockResolvedValue(mockResponse);
        
        const { createEnhancedSSEReader } = await import('../../src/utils/sseUtils');
        createEnhancedSSEReader.mockResolvedValue('Receptionist response');

        const result = await chatbotAPI.receptionist('Appointment question');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/genai/chatbot/receptionist'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            })
          })
        );
        
        expect(result).toBe('Receptionist response');
      });
    });

    describe('triage endpoint', () => {
      it('should call triage endpoint with authentication', async () => {
        const mockResponse = new Response('data: Triage assessment\n\n', {
          status: 200,
          headers: { 'content-type': 'text/event-stream' }
        });
        
        fetch.mockResolvedValue(mockResponse);
        
        const { createEnhancedSSEReader } = await import('../../src/utils/sseUtils');
        createEnhancedSSEReader.mockResolvedValue('Triage assessment');

        const result = await chatbotAPI.triage('Symptom description');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/genai/chatbot/triage'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            })
          })
        );
        
        expect(result).toBe('Triage assessment');
      });
    });

    describe('documentationSummarize endpoint', () => {
      it('should call documentation summarize endpoint with authentication', async () => {
        const mockResponse = new Response('data: Document summary\n\n', {
          status: 200,
          headers: { 'content-type': 'text/event-stream' }
        });
        
        fetch.mockResolvedValue(mockResponse);
        
        const { createEnhancedSSEReader } = await import('../../src/utils/sseUtils');
        createEnhancedSSEReader.mockResolvedValue('Document summary');

        const result = await chatbotAPI.documentationSummarize('Document content');

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/genai/chatbot/documentation/summarize'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            })
          })
        );
        
        expect(result).toBe('Document summary');
      });
    });
  });

  describe('legacy methods', () => {
    it('should support botAssistant legacy method', async () => {
      const mockResponse = new Response('data: Help response\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' }
      });
      
      fetch.mockResolvedValue(mockResponse);
      
      const { createEnhancedSSEReader } = await import('../../src/utils/sseUtils');
      createEnhancedSSEReader.mockResolvedValue('Help response');

      const result = await chatbotAPI.botAssistant('Help question');
      expect(result).toBe('Help response');
    });

    it('should support botDentist legacy method', async () => {
      setBearerSession('mock-jwt-token', 'Bearer');

      const mockResponse = new Response('data: Clinical response\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' }
      });
      
      fetch.mockResolvedValue(mockResponse);
      
      const { createEnhancedSSEReader } = await import('../../src/utils/sseUtils');
      createEnhancedSSEReader.mockResolvedValue('Clinical response');

      const result = await chatbotAPI.botDentist('Clinical question');
      expect(result).toBe('Clinical response');
    });
  });

  describe('utility methods', () => {
    it('should indicate backend integration is enabled', () => {
      expect(chatbotAPI.isBackendIntegrationEnabled()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors specifically', async () => {
      const error = new Error('You have reached the maximal inquiries for today');
      fetch.mockRejectedValue(error);

      const callback = vi.fn();
      
      await expect(chatbotAPI.help('Test message', callback)).rejects.toThrow();
      
      expect(callback).toHaveBeenCalledWith(
        expect.stringContaining('maximal inquiries'),
        expect.stringContaining('maximal inquiries')
      );
    });

    it('should handle SSE streaming errors', async () => {
      const error = new Error('SSE streaming failed');
      fetch.mockRejectedValue(error);

      const callback = vi.fn();
      
      await expect(chatbotAPI.help('Test message', callback)).rejects.toThrow();
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-snackbar',
          detail: expect.objectContaining({
            message: expect.stringContaining('connection error'),
            severity: 'error'
          })
        })
      );
    });
  });
});
