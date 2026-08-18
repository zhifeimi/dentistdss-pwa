import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../src/services';
import { ChatTransportError } from '../../src/services/chatbot';
import { useChatAPI } from '../../src/hooks/useChatAPI';
import { useChatState } from '../../src/hooks/useChatState';

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

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const renderChat = () =>
  renderHook(() => {
    const state = useChatState();
    return { state, chat: useChatAPI(state) };
  });

describe('useChatAPI', () => {
  beforeEach(() => {
    mocks.send.mockReset();
  });

  it('updates the bot message from cumulative text and finalizes a completed response', async () => {
    mocks.send.mockImplementationOnce(async (
      agent: string,
      prompt: string,
      options: { signal: AbortSignal; onText: (text: string) => void },
    ) => {
      expect(agent).toBe('help');
      expect(prompt).toBe('Hello');
      expect(options.signal).toBeInstanceOf(AbortSignal);
      options.onText('Hello');
      options.onText('Hello there');
      return { kind: 'completed', text: 'Hello there' };
    });
    const { result } = renderChat();

    await act(async () => {
      await result.current.chat.sendMessage(' Hello ');
    });

    expect(mocks.send).toHaveBeenCalledWith(
      'help',
      'Hello',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        onText: expect.any(Function),
      }),
    );
    expect(result.current.state.messages).toHaveLength(2);
    expect(result.current.state.messages[1]).toMatchObject({
      sender: 'bot',
      text: 'Hello there',
      isStreaming: false,
    });
    expect(result.current.chat.isProcessing).toBe(false);
  });

  it('keeps an empty completed response as a finalized placeholder', async () => {
    mocks.send.mockResolvedValueOnce({ kind: 'completed', text: '' });
    const { result } = renderChat();

    await act(async () => {
      await result.current.chat.sendMessage('Hello');
    });

    expect(result.current.state.messages).toHaveLength(2);
    expect(result.current.state.messages[1]).toMatchObject({
      sender: 'bot',
      text: '',
      isStreaming: false,
    });
  });

  it('finalizes a cancelled response when partial text exists', async () => {
    mocks.send.mockImplementationOnce(async (
      _agent: string,
      _prompt: string,
      options: { onText: (text: string) => void },
    ) => {
      options.onText('Partial response');
      return { kind: 'cancelled', text: 'Partial response' };
    });
    const { result } = renderChat();

    await act(async () => {
      await result.current.chat.sendMessage('Hello');
    });

    expect(result.current.state.messages).toHaveLength(2);
    expect(result.current.state.messages[1]).toMatchObject({
      sender: 'bot',
      text: 'Partial response',
      isStreaming: false,
    });
  });

  it('removes the placeholder for an empty cancelled response', async () => {
    mocks.send.mockResolvedValueOnce({ kind: 'cancelled', text: '' });
    const { result } = renderChat();

    await act(async () => {
      await result.current.chat.sendMessage('Hello');
    });

    expect(result.current.state.messages).toHaveLength(1);
    expect(result.current.state.messages[0]).toMatchObject({ sender: 'user', text: 'Hello' });
  });

  it('retains partial transport failures and sets the separate error state', async () => {
    const error = new ChatTransportError(
      'network',
      'The chatbot network request failed.',
      undefined,
      'Partial response',
    );
    mocks.send.mockRejectedValueOnce(error);
    const { result } = renderChat();

    await act(async () => {
      await result.current.chat.sendMessage('Hello');
    });

    expect(result.current.state.messages).toHaveLength(2);
    expect(result.current.state.messages[1]).toMatchObject({
      sender: 'bot',
      text: 'Partial response',
      isStreaming: false,
    });
    expect(result.current.state.chatState.error).toBe(
      'Network connection failed. Please check your internet connection and try again.',
    );
    expect(result.current.state.messages.some((message) => message.error)).toBe(false);
  });

  it('adds the generic bot error bubble and error state for failures without partial text', async () => {
    mocks.send.mockRejectedValueOnce(
      new ChatTransportError('network', 'The chatbot network request failed.'),
    );
    const { result } = renderChat();

    await act(async () => {
      await result.current.chat.sendMessage('Hello');
    });

    expect(result.current.state.messages).toHaveLength(2);
    expect(result.current.state.messages[1]).toMatchObject({
      sender: 'bot',
      error: true,
      text: "I'm sorry, I encountered an error processing your request. Please try again later.",
    });
    expect(result.current.state.chatState.error).toBe(
      'Network connection failed. Please check your internet connection and try again.',
    );
  });

  it('guards against duplicate sends while a request is processing', async () => {
    const request = deferred<{ kind: 'completed'; text: string }>();
    mocks.send.mockReturnValueOnce(request.promise);
    const { result } = renderChat();
    let firstRequest!: Promise<void>;
    let secondRequest!: Promise<void>;

    act(() => {
      firstRequest = result.current.chat.sendMessage('First');
      secondRequest = result.current.chat.sendMessage('Second');
    });

    await act(async () => {
      await secondRequest;
    });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(result.current.state.messages).toHaveLength(2);

    await act(async () => {
      request.resolve({ kind: 'completed', text: 'Done' });
      await firstRequest;
    });
  });

  it('aborts the active request when the hook unmounts', async () => {
    const request = deferred<{ kind: 'completed'; text: string }>();
    let signal!: AbortSignal;
    mocks.send.mockImplementationOnce(
      (_agent: string, _prompt: string, options: { signal: AbortSignal }) => {
        signal = options.signal;
        return request.promise;
      },
    );
    const { result, unmount } = renderChat();

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.chat.sendMessage('Hello');
    });
    await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal));

    unmount();

    expect(signal.aborted).toBe(true);
    await act(async () => {
      request.resolve({ kind: 'completed', text: 'Done' });
      await pending;
    });
  });

  it('does not let an older request clear loading for a newer request', async () => {
    const first = deferred<{ kind: 'cancelled'; text: '' }>();
    const second = deferred<{ kind: 'completed'; text: string }>();
    mocks.send.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderChat();

    let firstRequest!: Promise<void>;
    act(() => {
      firstRequest = result.current.chat.sendMessage('First');
    });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));

    // The public hook has one active request at a time; completion permits the next request.
    await act(async () => {
      first.resolve({ kind: 'cancelled', text: '' });
      await firstRequest;
    });

    let secondRequest!: Promise<void>;
    act(() => {
      secondRequest = result.current.chat.sendMessage('Second');
    });
    await act(async () => {
      second.resolve({ kind: 'completed', text: 'Done' });
      await secondRequest;
    });

    expect(result.current.state.chatState.isLoading).toBe(false);
    expect(api.chatbot.send).toHaveBeenCalledTimes(2);
  });
});
