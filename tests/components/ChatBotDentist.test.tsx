import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import api from '../../src/services';
import { ChatTransportError } from '../../src/services/chatbot';
import ChatBotDentist from '../../src/pages/Dashboard/ChatBotDentist';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock('../../src/services', () => ({
  default: {
    chatbot: {
      send: mocks.send,
    },
  },
}));

vi.mock('@mui/material/useMediaQuery', () => ({
  default: vi.fn(() => false),
}));

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
  unobserve() {}
});

vi.mock('../../src/components/MessageBubble', () => ({
  default: ({
    message,
    showThinking,
  }: {
    message: { role: string; content: string; thinking?: string | null; isStreaming?: boolean };
    showThinking?: boolean;
  }) => (
    <div
      data-testid={`message-${message.role === 'assistant' ? 'assistant' : message.role.toLowerCase()}`}
      data-content={message.content}
      data-thinking={message.thinking ?? ''}
      data-streaming={String(Boolean(message.isStreaming))}
      data-show-thinking={String(Boolean(showThinking))}
    >
      {message.content}
    </div>
  ),
}));

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

const renderPage = () => render(<ChatBotDentist />);

const submitQuestion = async (question: string) => {
  const user = userEvent.setup();
  const input = screen.getByRole('textbox');
  await user.type(input, question);
  await user.click(screen.getByRole('button'));
};

describe('ChatBotDentist direct page', () => {
  const send = api.chatbot.send as MockedFunction<typeof api.chatbot.send>;

  beforeEach(() => {
    send.mockReset();
  });

  it('renders the existing initial dentist message', () => {
    renderPage();

    expect(screen.getByTestId('message-professional dentist')).toHaveAttribute(
      'data-content',
      "Hello! I'm your professional dentist AI. How can I help you with your dental questions today?",
    );
  });

  it('sends the dentist agent with the prompt, abort signal, and streaming callback', async () => {
    send.mockResolvedValueOnce({ kind: 'completed', text: 'Answer' });
    renderPage();

    await submitQuestion('Clinical question');

    expect(send).toHaveBeenCalledWith(
      'aidentist',
      'Clinical question',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        onText: expect.any(Function),
      }),
    );
  });

  it('keeps cumulative thinking updates streaming until completion', async () => {
    const request = deferred<{ kind: 'completed'; text: string }>();
    send.mockImplementationOnce(async (
      _agent,
      _prompt,
      options: { onText?: (text: string) => void },
    ) => {
      options.onText?.('<think>first');
      options.onText?.('<think>first and second');
      options.onText?.('<think>first and second</think>Partial answer');
      return request.promise;
    });
    renderPage();

    await submitQuestion('Clinical question');

    await waitFor(() => {
      expect(screen.getAllByTestId('message-assistant').at(-1)).toMatchObject({
        dataset: expect.objectContaining({
          content: 'Partial answer',
          thinking: 'first and second',
          streaming: 'true',
        }),
      });
    });

    await act(async () => {
      request.resolve({ kind: 'completed', text: '<think>first and second</think>Final answer' });
      await request.promise;
    });

    const assistant = screen.getAllByTestId('message-assistant').at(-1);
    expect(assistant).toHaveAttribute('data-content', 'Final answer');
    expect(assistant).toHaveAttribute('data-thinking', 'first and second');
    expect(assistant).toHaveAttribute('data-streaming', 'false');
  });

  it('locks the input while a request is in flight', async () => {
    const request = deferred<{ kind: 'completed'; text: string }>();
    send.mockReturnValueOnce(request.promise);
    renderPage();

    await submitQuestion('Clinical question');

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();

    await act(async () => {
      request.resolve({ kind: 'completed', text: 'Answer' });
      await request.promise;
    });

    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('finalizes and retains partial assistant text on cancellation', async () => {
    send.mockImplementationOnce(async (
      _agent,
      _prompt,
      options: { onText?: (text: string) => void },
    ) => {
      options.onText?.('Partial answer');
      return { kind: 'cancelled', text: 'Partial answer' };
    });
    renderPage();

    await submitQuestion('Clinical question');

    await waitFor(() => {
      const assistant = screen.getAllByTestId('message-assistant').at(-1);
      expect(assistant).toHaveAttribute('data-content', 'Partial answer');
      expect(assistant).toHaveAttribute('data-streaming', 'false');
    });
    expect(screen.queryByText("I'm sorry, I encountered an error. Please try again later.")).not.toBeInTheDocument();
  });

  it('removes the empty assistant placeholder on cancellation without an error', async () => {
    send.mockResolvedValueOnce({ kind: 'cancelled', text: '' });
    renderPage();

    await submitQuestion('Clinical question');

    await waitFor(() => {
      expect(screen.queryAllByTestId('message-assistant')).toHaveLength(0);
    });
    expect(screen.queryByText("I'm sorry, I encountered an error. Please try again later.")).not.toBeInTheDocument();
  });

  it('retains partial failure text and appends a separate generic error message', async () => {
    send.mockImplementationOnce(async (
      _agent,
      _prompt,
      options: { onText?: (text: string) => void },
    ) => {
      options.onText?.('Partial answer');
      throw new ChatTransportError(
        'network',
        'The chatbot network request failed.',
        undefined,
        'Partial answer',
      );
    });
    renderPage();

    await submitQuestion('Clinical question');

    await waitFor(() => {
      expect(screen.getAllByTestId('message-assistant')).toHaveLength(2);
    });

    const assistants = screen.getAllByTestId('message-assistant');
    expect(assistants[0]).toHaveAttribute('data-content', 'Partial answer');
    expect(assistants[0]).toHaveAttribute('data-streaming', 'false');
    expect(assistants[1]).toHaveAttribute(
      'data-content',
      "I'm sorry, I encountered an error. Please try again later.",
    );
    expect(assistants[1]).toHaveAttribute('data-streaming', 'false');
  });

  it('replaces an empty failed placeholder with the generic error message', async () => {
    send.mockRejectedValueOnce(new Error('network failure'));
    renderPage();

    await submitQuestion('Clinical question');

    await waitFor(() => {
      const assistants = screen.getAllByTestId('message-assistant');
      expect(assistants).toHaveLength(1);
      expect(assistants[0]).toHaveAttribute(
        'data-content',
        "I'm sorry, I encountered an error. Please try again later.",
      );
    });
  });

  it('aborts the active request when the page unmounts', async () => {
    const request = deferred<{ kind: 'cancelled'; text: string }>();
    let signal!: AbortSignal;
    send.mockImplementationOnce(async (
      _agent,
      _prompt,
      options: { signal?: AbortSignal },
    ) => {
      signal = options.signal!;
      return request.promise;
    });
    const page = renderPage();

    await submitQuestion('Clinical question');
    expect(signal).not.toBeUndefined();
    expect(signal.aborted).toBe(false);

    page.unmount();

    expect(signal.aborted).toBe(true);
    await act(async () => {
      request.resolve({ kind: 'cancelled', text: '' });
      await request.promise;
    });
  });
});
