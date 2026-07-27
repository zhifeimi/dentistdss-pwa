import { describe, it, expect } from 'vitest';
import type {
  BackendChatRequest,
  BackendChatResponse,
  SSEChatEvent,
  BackendChatError,
  BackendSession,
  SSEProcessingOptions,
  BackendChatService
} from '../../src/types/openai';
import type { ChatType } from '../../src/types/common';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';

// Import types for testing (these should be available at runtime for type checking)
describe('OpenAI Types', () => {
  describe('Backend Integration Types', () => {
    it('should have proper BackendChatRequest structure', () => {
      const request: BackendChatRequest = {
        message: 'Test message',
        chatType: 'help' as ChatType,
        userId: 123,
        sessionId: 'session-123'
      };

      expect(request).toHaveProperty('message');
      expect(request).toHaveProperty('chatType');
      expect(request).toHaveProperty('userId');
      expect(request).toHaveProperty('sessionId');
      expect(typeof request.message).toBe('string');
      expect(typeof request.chatType).toBe('string');
      expect(typeof request.userId).toBe('number');
      expect(typeof request.sessionId).toBe('string');
    });

    it('should have proper BackendChatResponse structure', () => {
      const response: BackendChatResponse = {
        content: 'Response content',
        sessionId: 'session-123',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        }
      };

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('sessionId');
      expect(response).toHaveProperty('finishReason');
      expect(response).toHaveProperty('usage');
      expect(typeof response.content).toBe('string');
      expect(typeof response.sessionId).toBe('string');
      expect(typeof response.finishReason).toBe('string');
      expect(typeof response.usage.promptTokens).toBe('number');
    });

    it('should have proper SSEChatEvent structure', () => {
      const event: SSEChatEvent = {
        type: 'token',
        data: 'Hello',
        sessionId: 'session-123',
        finishReason: null
      };

      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('data');
      expect(event).toHaveProperty('sessionId');
      expect(event).toHaveProperty('finishReason');
      expect(['token', 'complete', 'error']).toContain(event.type);
    });
  });

  describe('Error Types', () => {
    it('should have proper BackendChatError structure', () => {
      const error = new Error('Test error') as BackendChatError;
      error.status = 500;
      error.code = 'INTERNAL_ERROR';
      error.type = 'server';
      error.retryable = true;

      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('status');
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('type');
      expect(error).toHaveProperty('retryable');
      expect(typeof error.status).toBe('number');
      expect(typeof error.retryable).toBe('boolean');
      expect(['authentication', 'rate_limit', 'network', 'server', 'validation']).toContain(error.type);
    });
  });

  describe('Session Types', () => {
    it('should have proper BackendSession structure', () => {
      const session: BackendSession = {
        sessionId: 'session-123',
        chatType: 'aidentist' as ChatType,
        userId: 123,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true
      };

      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('chatType');
      expect(session).toHaveProperty('userId');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('lastActivity');
      expect(session).toHaveProperty('isActive');
      expect(typeof session.sessionId).toBe('string');
      expect(typeof session.userId).toBe('number');
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(typeof session.isActive).toBe('boolean');
    });
  });

  describe('SSE Processing Types', () => {
    it('should have proper SSEProcessingOptions structure', () => {
      const options: SSEProcessingOptions = {
        enableTokenSpacing: true,
        validateChunks: true,
        logDebugInfo: false,
        maxRetries: 3
      };

      expect(options).toHaveProperty('enableTokenSpacing');
      expect(options).toHaveProperty('validateChunks');
      expect(options).toHaveProperty('logDebugInfo');
      expect(options).toHaveProperty('maxRetries');
      expect(typeof options.enableTokenSpacing).toBe('boolean');
      expect(typeof options.validateChunks).toBe('boolean');
      expect(typeof options.logDebugInfo).toBe('boolean');
      expect(typeof options.maxRetries).toBe('number');
    });
  });

  describe('Chat Service Interface', () => {
    it('should validate BackendChatService interface structure', () => {
      // Mock implementation to test interface structure
      const mockChatService: BackendChatService = {
        help: async (userInput: string, onTokenReceived?: any) => 'response',
        aidentist: async (userInput: string, onTokenReceived?: any) => 'response',
        receptionist: async (userInput: string, onTokenReceived?: any) => 'response',
        triage: async (userInput: string, onTokenReceived?: any) => 'response',
        documentationSummarize: async (userInput: string, onTokenReceived?: any) => 'response',
        isBackendIntegrationEnabled: () => true,
        getAuthStatus: () => ({ authenticated: true })
      };

      expect(mockChatService).toHaveProperty('help');
      expect(mockChatService).toHaveProperty('aidentist');
      expect(mockChatService).toHaveProperty('receptionist');
      expect(mockChatService).toHaveProperty('triage');
      expect(mockChatService).toHaveProperty('documentationSummarize');
      expect(mockChatService).toHaveProperty('isBackendIntegrationEnabled');
      expect(mockChatService).toHaveProperty('getAuthStatus');

      expect(typeof mockChatService.help).toBe('function');
      expect(typeof mockChatService.aidentist).toBe('function');
      expect(typeof mockChatService.receptionist).toBe('function');
      expect(typeof mockChatService.triage).toBe('function');
      expect(typeof mockChatService.documentationSummarize).toBe('function');
      expect(typeof mockChatService.isBackendIntegrationEnabled).toBe('function');
      expect(typeof mockChatService.getAuthStatus).toBe('function');
    });
  });

  describe('Chat Types Validation', () => {
    it('should validate chat type values', () => {
      const validChatTypes: ChatType[] = ['help', 'aidentist', 'receptionist', 'triage', 'documentationSummarize'];

      validChatTypes.forEach((chatType: ChatType) => {
        expect(typeof chatType).toBe('string');
        expect(chatType.length).toBeGreaterThan(0);
      });

      // Test that all expected chat types are present
      expect(validChatTypes).toContain('help');
      expect(validChatTypes).toContain('aidentist');
      expect(validChatTypes).toContain('receptionist');
      expect(validChatTypes).toContain('triage');
      expect(validChatTypes).toContain('documentationSummarize');
    });
  });

  describe('Callback Function Types', () => {
    it('should validate StreamCallback function signature', () => {
      const mockStreamCallback = (token: string, fullText: string): void => {
        expect(typeof token).toBe('string');
        expect(typeof fullText).toBe('string');
      };

      // Test the callback
      mockStreamCallback('test token', 'full response text');
      expect(typeof mockStreamCallback).toBe('function');
    });
  });

  describe('OpenAI SDK Type Re-exports', () => {
    it('should verify OpenAI SDK types are available for type-only use', () => {
      const chunk: ChatCompletionChunk = {
        id: 'chatcmpl-test',
        choices: [],
        created: 0,
        model: 'test-model',
        object: 'chat.completion.chunk'
      };

      expect(chunk.object).toBe('chat.completion.chunk');
    });
  });

  describe('Type Compatibility', () => {
    it('should ensure backend request/response compatibility', () => {
      // Test that request and response types are compatible
      const request: BackendChatRequest = {
        message: 'Test message',
        chatType: 'help' as ChatType,
        userId: 123,
        sessionId: 'session-123'
      };

      const response: BackendChatResponse = {
        content: 'Response to: ' + request.message,
        sessionId: request.sessionId,
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        }
      };

      expect(response.sessionId).toBe(request.sessionId);
      expect(response.content).toContain(request.message);
    });

    it('should ensure error types are properly structured', () => {
      const errorTypes: Array<'authentication' | 'rate_limit' | 'network' | 'server' | 'validation'> =
        ['authentication', 'rate_limit', 'network', 'server', 'validation'];

      errorTypes.forEach((type) => {
        const error = new Error(`Test ${type} error`) as BackendChatError;
        error.type = type;
        error.retryable = ['network', 'server'].includes(type);

        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('retryable');
        expect(typeof error.retryable).toBe('boolean');
      });
    });
  });
});
