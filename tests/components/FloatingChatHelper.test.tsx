import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import FloatingChatHelper from '../../src/components/Home/Helper';
import api from '../../src/services';
import { type ChatbotResult, ChatTransportError } from '../../src/services/chatbot';
import { testUtils } from '../setup';

// Mock the entire Material-UI system
vi.mock('@mui/material/useMediaQuery', () => ({
  default: vi.fn(() => false),
}));

vi.mock('@mui/system', () => ({
  useMediaQuery: vi.fn(() => false),
}));

// Mock the API
vi.mock('../../src/services', () => ({
  default: {
    chatbot: {
      send: vi.fn(),
    },
  },
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

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const completed = (text: string): ChatbotResult => ({ kind: 'completed', text });

describe('FloatingChatHelper Component', () => {
  const mockChatbotSend = api.chatbot.send as MockedFunction<typeof api.chatbot.send>;

  beforeEach(() => {
    testUtils.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the floating chat button', () => {
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
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
        </TestWrapper>,
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
        </TestWrapper>,
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
        </TestWrapper>,
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
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

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
        </TestWrapper>,
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
      mockChatbotSend.mockResolvedValueOnce(completed('Hello! How can I help you?'));

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(mockChatbotSend).toHaveBeenCalledWith(
        'help',
        'Hello',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          onText: expect.any(Function),
        }),
      );
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should handle cumulative streaming response without timers', async () => {
      const user = userEvent.setup();
      const response = deferred<ChatbotResult>();
      let onText!: (text: string) => void;
      mockChatbotSend.mockImplementationOnce(async (_agent, _prompt, options) => {
        onText = options.onText!;
        return response.promise;
      });

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hi');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => expect(onText).toBeTypeOf('function'));
      act(() => {
        onText('Hello');
        onText('Hello there!');
      });
      expect(screen.getByText('Hello there!')).toBeInTheDocument();

      act(() => {
        response.resolve(completed('Hello there!'));
      });
      await waitFor(() => expect(screen.queryByText('Typing...')).not.toBeInTheDocument());
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();

      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '   ');

      expect(sendButton).toBeDisabled();
      expect(mockChatbotSend).not.toHaveBeenCalled();
    });

    it('should handle Enter key submission', async () => {
      const user = userEvent.setup();
      mockChatbotSend.mockResolvedValueOnce(completed('Response'));

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);

      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello{enter}');

      expect(mockChatbotSend).toHaveBeenCalledWith(
        'help',
        'Hello',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          onText: expect.any(Function),
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const user = userEvent.setup();
      mockChatbotSend.mockRejectedValueOnce(
        new ChatTransportError('network', 'The chatbot network request failed.'),
      );

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Network connection failed. Please check your internet connection and try again.',
          ),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText(
          "I'm sorry, I encountered an error processing your request. Please try again later.",
        ),
      ).toBeInTheDocument();
    });

    it('should clear error when new message is sent', async () => {
      const user = userEvent.setup();
      mockChatbotSend
        .mockRejectedValueOnce(
          new ChatTransportError('network', 'The chatbot network request failed.'),
        )
        .mockResolvedValueOnce(completed('Success response'));

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);
      await waitFor(() => {
        expect(
          screen.getByText(
            'Network connection failed. Please check your internet connection and try again.',
          ),
        ).toBeInTheDocument();
      });

      await user.clear(input);
      await user.type(input, 'Try again');
      await user.click(sendButton);

      await waitFor(() => {
        expect(
          screen.queryByText(
            'Network connection failed. Please check your internet connection and try again.',
          ),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during API call', async () => {
      const user = userEvent.setup();
      const response = deferred<ChatbotResult>();
      mockChatbotSend.mockReturnValueOnce(response.promise);

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(screen.getByPlaceholderText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Typing...')).toBeInTheDocument();
      expect(sendButton).toBeDisabled();

      act(() => {
        response.resolve(completed('Response'));
      });
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Processing...')).not.toBeInTheDocument();
      });
    });

    it('should disable input and button during loading', async () => {
      const user = userEvent.setup();
      const response = deferred<ChatbotResult>();
      mockChatbotSend.mockReturnValueOnce(response.promise);

      render(
        <TestWrapper>
          <FloatingChatHelper />
        </TestWrapper>,
      );

      const chatButton = screen.getByRole('button', { name: /chat/i });
      await user.click(chatButton);
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();

      act(() => {
        response.resolve(completed('Response'));
      });
      await waitFor(() => expect(input).not.toBeDisabled());
    });
  });

  it('aborts the captured request when the helper unmounts', async () => {
    const user = userEvent.setup();
    const response = deferred<ChatbotResult>();
    let capturedSignal!: AbortSignal;
    mockChatbotSend.mockImplementationOnce(async (_agent, _prompt, options) => {
      capturedSignal = options.signal!;
      return response.promise;
    });

    const { unmount } = render(
      <TestWrapper>
        <FloatingChatHelper />
      </TestWrapper>,
    );

    const chatButton = screen.getByRole('button', { name: /chat/i });
    await user.click(chatButton);
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(capturedSignal).toBeInstanceOf(AbortSignal));
    unmount();

    expect(capturedSignal.aborted).toBe(true);
    act(() => {
      response.resolve(completed('Response'));
    });
  });
});
