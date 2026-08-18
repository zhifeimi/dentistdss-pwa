import React, { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useChatState } from '../../../hooks/useChatState';
import { useChatAPI } from '../../../hooks/useChatAPI';
import FloatingChatButton from './FloatingChatButton';
import ChatDialog from './ChatDialog';

/**
 * Floating Chat Helper Props Interface
 * Simplified to focus on essential functionality
 */
interface FloatingChatHelperProps {
  readonly darkMode?: boolean;
  readonly toggleDarkMode?: () => void;
  readonly isMobile?: boolean;
}

/**
 * Floating Chat Helper Component
 *
 * Refactored following SOLID principles:
 * - Single Responsibility: Only orchestrates chat functionality
 * - Open/Closed: Extensible through composition
 * - Liskov Substitution: Uses interface-based dependencies
 * - Interface Segregation: Focused interfaces for each concern
 * - Dependency Inversion: Depends on abstractions (hooks)
 *
 * Follows DRY, KISS, and YAGNI principles:
 * - DRY: Reusable hooks and components
 * - KISS: Simple, focused component structure
 * - YAGNI: Only implements required functionality
 */
const FloatingChatHelper: React.FC<FloatingChatHelperProps> = () => {
  // Local UI state (minimal, focused)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');

  // Custom hooks for state management (separation of concerns)
  const chatState = useChatState();
  const chatAPI = useChatAPI(chatState);

  // Dialog control handlers
  const handleToggleDialog = useCallback(() => {
    setIsDialogOpen((prev) => {
      if (!prev) {
        // Clear errors when opening dialog
        chatState.stateActions.clearError();
      }
      return !prev;
    });
  }, [chatState.stateActions]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // Input handlers
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // Message submission handler
  const handleSubmitMessage = useCallback(async (message: string) => {
    try {
      await chatAPI.sendMessage(message);
      setInputValue(''); // Clear input on successful send
    } catch (error) {
      // Error handling is managed by the chatAPI hook
      console.error('Failed to send message:', error);
    }
  }, [chatAPI]);

  // Render the component using composition
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 20 },
        right: { xs: 16, sm: 20 },
        zIndex: 1000,
      }}
    >
      {/* Floating Chat Button */}
      <FloatingChatButton
        isOpen={isDialogOpen}
        isLoading={chatAPI.isProcessing}
        onClick={handleToggleDialog}
      />

      {/* Chat Dialog */}
      <ChatDialog
        isOpen={isDialogOpen}
        messages={chatState.messages}
        chatState={chatState.chatState}
        inputValue={inputValue}
        onClose={handleCloseDialog}
        onInputChange={handleInputChange}
        onSubmit={handleSubmitMessage}
        onClearError={chatState.stateActions.clearError}
      />
    </Box>
  );
};

export default FloatingChatHelper;
