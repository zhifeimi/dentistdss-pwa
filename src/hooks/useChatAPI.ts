import { useCallback, useRef } from 'react';
import api from '../services';
import type { TokenCallback } from '../utils/sseUtils';
import type { ChatMessage, UseChatStateReturn } from './useChatState';

/**
 * Chat API Configuration
 */
interface ChatAPIConfig {
  readonly maxRetries: number;
  readonly retryDelay: number;
  readonly timeout: number;
}

/**
 * Chat API Error Types
 */
export enum ChatAPIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Chat API Error Class
 */
export class ChatAPIError extends Error {
  constructor(
    public readonly type: ChatAPIErrorType,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ChatAPIConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
} as const;

/**
 * Chat API Hook Interface
 */
interface UseChatAPIReturn {
  sendMessage: (message: string) => Promise<void>;
  isProcessing: boolean;
  cancelRequest: () => void;
}

/**
 * Custom hook for handling chat API interactions
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only handles API communication
 * - Open/Closed: Extensible through configuration
 * - Liskov Substitution: Can be replaced with different implementations
 * - Interface Segregation: Focused interface for API operations
 * - Dependency Inversion: Depends on abstractions (chat state hook)
 */
export const useChatAPI = (
  chatState: UseChatStateReturn,
  config: Partial<ChatAPIConfig> = {}
): UseChatAPIReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const abortControllerRef = useRef<AbortController | null>(null);
  const { messageActions, stateActions } = chatState;

  /**
   * Validate message input
   */
  const validateMessage = useCallback((message: string): void => {
    if (!message || typeof message !== 'string') {
      throw new ChatAPIError(
        ChatAPIErrorType.VALIDATION_ERROR,
        'Message must be a non-empty string'
      );
    }

    if (message.trim().length === 0) {
      throw new ChatAPIError(
        ChatAPIErrorType.VALIDATION_ERROR,
        'Message cannot be empty or whitespace only'
      );
    }

    if (message.length > 10000) {
      throw new ChatAPIError(
        ChatAPIErrorType.VALIDATION_ERROR,
        'Message is too long (maximum 10,000 characters)'
      );
    }
  }, []);

  /**
   * Classify error type based on error characteristics
   */
  const classifyError = useCallback((error: any): ChatAPIErrorType => {
    const errorMessage = String(error.message || '').toLowerCase();

    if (error.name === 'AbortError') {
      return ChatAPIErrorType.NETWORK_ERROR;
    }

    if (error.name === 'TimeoutError') {
      return ChatAPIErrorType.TIMEOUT_ERROR;
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('maximal inquiries')) {
      return ChatAPIErrorType.RATE_LIMIT_ERROR;
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ChatAPIErrorType.NETWORK_ERROR;
    }

    return ChatAPIErrorType.UNKNOWN_ERROR;
  }, []);

  /**
   * Create user-friendly error message
   */
  const createErrorMessage = useCallback((error: ChatAPIError): string => {
    switch (error.type) {
      case ChatAPIErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection and try again.';
      
      case ChatAPIErrorType.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      
      case ChatAPIErrorType.RATE_LIMIT_ERROR:
        return 'You have reached the maximum number of requests. Please try again later.';
      
      case ChatAPIErrorType.VALIDATION_ERROR:
        return error.message;
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }, []);

  /**
   * Handle streaming response
   */
  const handleStreamingResponse = useCallback((
    userMessage: ChatMessage,
    botMessage: ChatMessage
  ): TokenCallback => {
    return (token: string, fullText: string) => {
      try {
        messageActions.updateMessage(botMessage.id, {
          text: fullText,
          isStreaming: true,
        });
      } catch (error) {
        console.warn('Failed to update streaming message:', error);
      }
    };
  }, [messageActions]);

  /**
   * Finalize bot response
   */
  const finalizeBotResponse = useCallback((
    botMessage: ChatMessage,
    finalText: string
  ): void => {
    messageActions.updateMessage(botMessage.id, {
      text: finalText,
      isStreaming: false,
    });
  }, [messageActions]);

  /**
   * Handle API error
   */
  const handleAPIError = useCallback((
    error: any,
    botMessage: ChatMessage
  ): void => {
    const errorType = classifyError(error);
    const chatError = new ChatAPIError(errorType, error.message || 'Unknown error', error);
    const userMessage = createErrorMessage(chatError);

    // Remove streaming placeholder
    messageActions.removeMessage(botMessage.id);

    // Add error message
    messageActions.addMessage({
      sender: 'bot',
      text: "I'm sorry, I encountered an error processing your request. Please try again later.",
      error: true,
    });

    // Set error state
    stateActions.setError(userMessage);

    console.error('Chat API Error:', chatError);
  }, [classifyError, createErrorMessage, messageActions, stateActions]);

  /**
   * Cancel current request
   */
  const cancelRequest = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Send message to chat API
   */
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    let botMessage: ChatMessage | null = null;

    try {
      // Validate input
      validateMessage(message);

      // Check if already processing
      if (chatState.chatState.isLoading) {
        throw new ChatAPIError(
          ChatAPIErrorType.VALIDATION_ERROR,
          'Another request is already in progress'
        );
      }

      // Clear any previous errors
      stateActions.clearError();
      stateActions.setLoading(true);

      // Add user message
      const userMessage = messageActions.addMessage({
        sender: 'user',
        text: message.trim(),
      });

      // Add streaming bot message placeholder
      botMessage = messageActions.addMessage({
        sender: 'bot',
        text: '',
        isStreaming: true,
      });

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Create streaming callback
      const streamingCallback = handleStreamingResponse(userMessage, botMessage);

      // Make API call
      const finalResponse = await api.chatbot.help(message.trim(), streamingCallback);

      // Finalize bot response
      finalizeBotResponse(botMessage, finalResponse);

    } catch (error: any) {
      if (botMessage) {
        handleAPIError(error, botMessage);
      } else {
        // If no streaming message, just set error state
        const errorType = classifyError(error);
        const chatError = new ChatAPIError(errorType, error.message || 'Unknown error', error);
        stateActions.setError(createErrorMessage(chatError));
      }
    } finally {
      stateActions.setLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    validateMessage,
    chatState.chatState.isLoading,
    chatState.messages,
    stateActions,
    messageActions,
    handleStreamingResponse,
    finalizeBotResponse,
    handleAPIError,
    classifyError,
    createErrorMessage,
  ]);

  return {
    sendMessage,
    isProcessing: chatState.chatState.isLoading,
    cancelRequest,
  } as const;
};

/**
 * Utility function to check if an error is retryable
 */
export const isRetryableError = (error: ChatAPIError): boolean => {
  return error.type === ChatAPIErrorType.NETWORK_ERROR || 
         error.type === ChatAPIErrorType.TIMEOUT_ERROR;
};

/**
 * Utility function to get retry delay with exponential backoff
 */
export const getRetryDelay = (attempt: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
};
