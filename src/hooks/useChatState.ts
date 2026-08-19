import { useState, useCallback, useRef } from 'react';

/**
 * Chat Message Interface
 * Simplified and focused on essential properties
 */
export interface ChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'bot';
  readonly text: string;
  readonly timestamp: Date;
  readonly isStreaming?: boolean;
  readonly error?: boolean;
}

/**
 * Chat State Interface
 * Centralized state management for chat functionality
 */
export interface ChatState {
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly hasError: boolean;
}

/**
 * Chat State Actions Interface
 * Defines all possible state mutations
 */
interface ChatStateActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Message Actions Interface
 * Defines all message-related operations
 */
interface MessageActions {
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  generateMessageId: () => string;
}

/**
 * Combined Hook Return Type
 */
export interface UseChatStateReturn {
  // State
  messages: readonly ChatMessage[];
  chatState: ChatState;
  
  // Actions
  messageActions: MessageActions;
  stateActions: ChatStateActions;
}

/**
 * Initial chat state
 */
const INITIAL_CHAT_STATE: ChatState = {
  isLoading: false,
  error: null,
  hasError: false,
} as const;

/**
 * Custom hook for managing chat state and messages
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only manages chat state
 * - Open/Closed: Extensible through actions interface
 * - Interface Segregation: Separate interfaces for different concerns
 * - Dependency Inversion: Depends on abstractions, not concretions
 */
export const useChatState = (): UseChatStateReturn => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatState, setChatState] = useState<ChatState>(INITIAL_CHAT_STATE);
  
  // Refs for stable references
  const messageIdCounter = useRef<number>(0);

  // Message ID generation (pure function)
  const generateMessageId = useCallback((): string => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  // Message actions (following Command pattern)
  const addMessage = useCallback((messageData: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: generateMessageId(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [generateMessageId]);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>): void => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const removeMessage = useCallback((id: string): void => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearMessages = useCallback((): void => {
    setMessages([]);
  }, []);

  // State actions (following Command pattern)
  const setLoading = useCallback((loading: boolean): void => {
    setChatState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null): void => {
    setChatState(prev => ({ 
      ...prev, 
      error, 
      hasError: !!error 
    }));
  }, []);

  const clearError = useCallback((): void => {
    setChatState(prev => ({ 
      ...prev, 
      error: null, 
      hasError: false 
    }));
  }, []);

  const reset = useCallback((): void => {
    setChatState(INITIAL_CHAT_STATE);
    clearMessages();
  }, [clearMessages]);

  // Grouped actions for better organization
  const messageActions: MessageActions = {
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    generateMessageId,
  };

  const stateActions: ChatStateActions = {
    setLoading,
    setError,
    clearError,
    reset,
  };

  return {
    messages,
    chatState,
    messageActions,
    stateActions,
  } as const;
};
