import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FloatingChatHelper from '../../src/components/Home/Helper';
import api from '../../src/services';
import type { TokenCallback } from '../../src/utils/sseUtils';
import { testUtils } from '../setup';

// Mock the entire Material-UI system
vi.mock('@mui/material/useMediaQuery', () => ({
  default: vi.fn(() => false)
}));

vi.mock('@mui/system', () => ({
  useMediaQuery: vi.fn(() => false)
}));

// Mock the API
vi.mock('../../src/services', () => ({
  default: {
    chatbot: {
      help: vi.fn()
    }
  }
}));

// Test wrapper with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
  });
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('FloatingChatHelper Component', () => {
  const mockChatbotHelp = api.chatbot.help as MockedFunction<typeof api.chatbot.help>;

  beforeEach(() => {
    testUtils.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the floating chat button', () => {
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveAttribute('aria-label', 'chat');
    });

    it('should show tooltip on hover', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.hover(chatButton);
      
      await waitFor(() => {
        expect(screen.getByText('Chat with Dentabot')).toBeInTheDocument();
      });
    });

    it('should not show chat dialog initially', () => {
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      expect(screen.queryByText('Dentabot')).not.toBeInTheDocument();
    });
  });

  describe('Chat Dialog Interaction', () => {
    it('should open chat dialog when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      expect(screen.getByText('Dentabot')).toBeInTheDocument();
      expect(screen.getByText('Hi there! How can I help you today?')).toBeInTheDocument();
    });

    it('should close chat dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      // Close dialog
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Dentabot')).not.toBeInTheDocument();
      });
    });

    it('should show input field and send button when dialog is open', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('should send message when form is submitted', async () => {
      const user = userEvent.setup();
      const mockResponse = 'Hello! How can I help you?';
      
      mockChatbotHelp.mockResolvedValue(mockResponse);

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      // Type message
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');

      // Send message
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Check API was called
      expect(mockChatbotHelp).toHaveBeenCalledWith(
        'Hello',
        expect.any(Function)
      );

      // Check user message appears
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should handle streaming response correctly', async () => {
      const user = userEvent.setup();
      let streamingCallback: TokenCallback;
      
      mockChatbotHelp.mockImplementation(async (message: string, callback?: TokenCallback) => {
        if (callback) {
          streamingCallback = callback;
          // Simulate streaming
          setTimeout(() => {
            callback('Hello', 'Hello');
            callback(' there!', 'Hello there!');
          }, 100);
        }
        return 'Hello there!';
      });

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog and send message
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hi');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for streaming to complete
      await waitFor(() => {
        expect(screen.getByText('Hello there!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      // Try to send empty message
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();

      // Try with whitespace only
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '   ');
      
      expect(sendButton).toBeDisabled();
      expect(mockChatbotHelp).not.toHaveBeenCalled();
    });

    it('should handle Enter key submission', async () => {
      const user = userEvent.setup();
      mockChatbotHelp.mockResolvedValue('Response');

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      // Type message and press Enter
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello{enter}');

      expect(mockChatbotHelp).toHaveBeenCalledWith('Hello', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network error occurred';
      
      mockChatbotHelp.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog and send message
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Network connection failed. Please check your internet connection and try again.')).toBeInTheDocument();
      });

      // Check error message in chat
      expect(screen.getByText("I'm sorry, I encountered an error processing your request. Please try again later.")).toBeInTheDocument();
    });

    it('should clear error when new message is sent', async () => {
      const user = userEvent.setup();
      
      // First call fails
      mockChatbotHelp.mockRejectedValueOnce(new Error('Network error'));
      // Second call succeeds
      mockChatbotHelp.mockResolvedValueOnce('Success response');

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send first message (fails)
      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Network connection failed. Please check your internet connection and try again.')).toBeInTheDocument();
      });

      // Send second message (succeeds)
      await user.clear(input);
      await user.type(input, 'Try again');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.queryByText('Network connection failed. Please check your internet connection and try again.')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during API call', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: string) => void;
      
      mockChatbotHelp.mockImplementation(() => {
        return new Promise<string>((resolve) => {
          resolvePromise = resolve;
        });
      });

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog and send message
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Check loading states
      expect(screen.getByPlaceholderText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Typing...')).toBeInTheDocument();
      expect(sendButton).toBeDisabled();

      // Resolve the promise
      act(() => {
        resolvePromise!('Response');
      });

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Processing...')).not.toBeInTheDocument();
      });
    });

    it('should disable input and button during loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: string) => void;
      
      mockChatbotHelp.mockImplementation(() => {
        return new Promise<string>((resolve) => {
          resolvePromise = resolve;
        });
      });

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>
      );

      // Open dialog and send message
      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Check disabled states
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();

      // Resolve the promise
      act(() => {
        resolvePromise!('Response');
      });

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });
});
