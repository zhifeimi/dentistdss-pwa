import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services';
import { ChatTransportError, type ChatbotAgent } from '../services/chatbot';

interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

type ChatType = ChatbotAgent;

type TextObserver = (text: string) => void;

interface UseAIChatReturn {
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  error: string;
  sendMessage: (messageContent?: string | null, onText?: TextObserver) => Promise<void>;
  clearConversation: (newWelcomeMessage?: string | null) => void;
  handleKeyPress: (event: React.KeyboardEvent) => void;
  setQuickInput: (text: string) => void;
  setInputValue: (value: string) => void;
  setError: (error: string) => void;
  hasMessages: boolean;
  hasError: boolean;
}

/**
 * Custom hook for AI chat functionality
 *
 * Features:
 * - Message state management
 * - Real-time SSE streaming support
 * - Error handling and loading states
 * - Reusable across different chat types
 * - Conversation cancellation on lifecycle changes
 */
const useAIChat = (chatType: ChatType = 'help', initialWelcomeMessage: string = ''): UseAIChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const controllerRef = useRef<AbortController | null>(null);

  const abortActiveRequest = useCallback((): void => {
    const controller = controllerRef.current;
    if (!controller) return;

    controller.abort();
    controllerRef.current = null;
  }, []);

  // Initialize or replace the welcome message.
  useEffect(() => {
    abortActiveRequest();
    setIsLoading(false);
    setError('');
    if (initialWelcomeMessage) {
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: initialWelcomeMessage,
        timestamp: new Date(),
      }]);
    } else {
      setMessages([]);
    }
  }, [abortActiveRequest, initialWelcomeMessage]);

  // Abort an in-flight transport when the hook leaves the tree.
  useEffect(() => abortActiveRequest, [abortActiveRequest]);

  // Send message handler.
  const sendMessage = useCallback(async (
    messageContent: string | null = null,
    onText: TextObserver | null = null,
  ): Promise<void> => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading || controllerRef.current) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    const aiMessage: ChatMessage = {
      id: userMessage.id + 1,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    const controller = new AbortController();
    controllerRef.current = controller;

    setMessages(prev => [...prev, userMessage, aiMessage]);
    if (!messageContent) setInputValue('');
    setIsLoading(true);
    setError('');

    const isCurrentRequest = (): boolean => controllerRef.current === controller;
    const updateAiMessage = (contentText: string, isStreaming: boolean): void => {
      if (!isCurrentRequest()) return;
      setMessages(prev => prev.map(message =>
        message.id === aiMessage.id
          ? { ...message, content: contentText, isStreaming }
          : message,
      ));
    };
    const removeAiMessage = (): void => {
      if (!isCurrentRequest()) return;
      setMessages(prev => prev.filter(message => message.id !== aiMessage.id));
    };
    const finalizeCancellation = (partialText: string): void => {
      if (partialText) {
        updateAiMessage(partialText, false);
      } else {
        removeAiMessage();
      }
    };

    try {
      const response = await api.chatbot.send(chatType, content, {
        signal: controller.signal,
        onText: (text) => {
          if (!isCurrentRequest()) return;
          updateAiMessage(text, true);
          onText?.(text);
        },
      });

      if (!isCurrentRequest()) return;
      if (response.kind === 'cancelled') {
        finalizeCancellation(response.text);
      } else {
        updateAiMessage(response.text, false);
      }
    } catch (caughtError) {
      if (!isCurrentRequest()) return;
      if (controller.signal.aborted) {
        const currentMessage = messages.find(message => message.id === aiMessage.id);
        finalizeCancellation(currentMessage?.content || '');
        return;
      }

      if (caughtError instanceof ChatTransportError) {
        if (caughtError.partialText) {
          updateAiMessage(caughtError.partialText, false);
        } else {
          removeAiMessage();
        }
        setError(caughtError.message);
      } else {
        removeAiMessage();
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to send message. Please try again.');
      }
    } finally {
      if (isCurrentRequest()) {
        controllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [chatType, inputValue, isLoading]);

  // Clear conversation.
  const clearConversation = useCallback((newWelcomeMessage: string | null = null): void => {
    abortActiveRequest();
    setIsLoading(false);
    const welcomeMessage = newWelcomeMessage || initialWelcomeMessage;
    if (welcomeMessage) {
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    } else {
      setMessages([]);
    }
    setError('');
  }, [abortActiveRequest, initialWelcomeMessage]);

  // Handle Enter key press.
  const handleKeyPress = useCallback((event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Set predefined input.
  const setQuickInput = useCallback((text: string): void => {
    setInputValue(text);
  }, []);

  return {
    // State
    messages,
    inputValue,
    isLoading,
    error,

    // Actions
    sendMessage,
    clearConversation,
    handleKeyPress,
    setQuickInput,
    setInputValue,
    setError,

    // Convenience
    hasMessages: messages.length > 0,
    hasError: error.length > 0,
  };
};

export default useAIChat;
