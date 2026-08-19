import { useCallback, useEffect, useRef } from 'react';
import api from '../services';
import { ChatTransportError } from '../services/chatbot';
import type { ChatMessage, UseChatStateReturn } from './useChatState';

interface UseChatAPIReturn {
  sendMessage: (message: string) => Promise<void>;
  isProcessing: boolean;
}

const GENERIC_BOT_ERROR =
  "I'm sorry, I encountered an error processing your request. Please try again later.";

const validateMessage = (message: string): string | null => {
  if (!message || typeof message !== 'string') {
    return 'Message must be a non-empty string';
  }

  if (message.trim().length === 0) {
    return 'Message cannot be empty or whitespace only';
  }

  if (message.length > 10000) {
    return 'Message is too long (maximum 10,000 characters)';
  }

  return null;
};

const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof ChatTransportError)) {
    return 'An unexpected error occurred. Please try again.';
  }

  switch (error.code) {
    case 'network':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'rate-limited':
      return 'You have reached the maximum number of requests. Please try again later.';
    case 'invalid-input':
      return error.message;
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Handles the floating help chat transport and its existing Home message model.
 */
export const useChatAPI = (chatState: UseChatStateReturn): UseChatAPIReturn => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);
  const { messageActions, stateActions } = chatState;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const finalizeBotResponse = useCallback((botMessage: ChatMessage, text: string): void => {
    messageActions.updateMessage(botMessage.id, {
      text,
      isStreaming: false,
    });
  }, [messageActions]);

  const handleAPIError = useCallback((error: unknown, botMessage: ChatMessage): void => {
    if (
      error instanceof ChatTransportError &&
      error.partialText !== undefined &&
      error.partialText !== ''
    ) {
      finalizeBotResponse(botMessage, error.partialText);
      stateActions.setError(getErrorMessage(error));
      return;
    }

    messageActions.removeMessage(botMessage.id);
    messageActions.addMessage({
      sender: 'bot',
      text: GENERIC_BOT_ERROR,
      error: true,
    });
    stateActions.setError(getErrorMessage(error));
  }, [finalizeBotResponse, messageActions, stateActions]);

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    const validationError = validateMessage(message);
    if (validationError) {
      if (mountedRef.current) {
        stateActions.setError(validationError);
      }
      return;
    }

    if (processingRef.current) {
      return;
    }

    processingRef.current = true;
    stateActions.clearError();
    stateActions.setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const trimmedMessage = message.trim();
    messageActions.addMessage({
      sender: 'user',
      text: trimmedMessage,
    });
    const botMessage = messageActions.addMessage({
      sender: 'bot',
      text: '',
      isStreaming: true,
    });

    try {
      const result = await api.chatbot.send('help', trimmedMessage, {
        signal: controller.signal,
        onText: (text) => {
          if (!mountedRef.current) {
            return;
          }
          messageActions.updateMessage(botMessage.id, {
            text,
            isStreaming: true,
          });
        },
      });

      if (!mountedRef.current) {
        return;
      }

      if (result.kind === 'cancelled' && result.text === '') {
        messageActions.removeMessage(botMessage.id);
      } else {
        finalizeBotResponse(botMessage, result.text);
      }
    } catch (error: unknown) {
      if (mountedRef.current) {
        handleAPIError(error, botMessage);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        processingRef.current = false;
        if (mountedRef.current) {
          stateActions.setLoading(false);
        }
      }
    }
  }, [finalizeBotResponse, handleAPIError, messageActions, stateActions]);

  return {
    sendMessage,
    isProcessing: chatState.chatState.isLoading,
  } as const;
};
