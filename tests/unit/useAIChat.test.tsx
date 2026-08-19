import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAIChat from '../../src/hooks/useAIChat';
import { ChatTransportError } from '../../src/services/chatbot';

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

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({ currentUser: null }),
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

describe('useAIChat', () => {
  beforeEach(() => {
    mocks.send.mockReset();
  });

  it.each(['help', 'aidentist', 'receptionist', 'triage', 'documentationSummarize'] as const)(
    'sends the %s agent through the shared chatbot transport',
    async (agent) => {
      mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
        options.onText?.(`response for ${agent}`);
        return { kind: 'completed', text: `response for ${agent}` };
      });
      const { result } = renderHook(() => useAIChat(agent));

      await act(async () => {
        await result.current.sendMessage('question');
      });

      expect(mocks.send).toHaveBeenCalledWith(
        agent,
        'question',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          onText: expect.any(Function),
        }),
      );
      expect(result.current.messages[1]).toMatchObject({
        type: 'ai',
        content: `response for ${agent}`,
        isStreaming: false,
      });
    },
  );

  it('keeps cumulative updates streaming until the transport completes', async () => {
    const response = deferred<{ kind: 'completed'; text: string }>();
    let observeText!: (text: string) => void;
    mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
      observeText = options.onText!;
      return response.promise;
    });
    const pageObserver = vi.fn();
    const { result } = renderHook(() => useAIChat('triage'));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('question', pageObserver);
    });
    await waitFor(() => expect(observeText).toBeTypeOf('function'));

    act(() => {
      observeText('first');
      observeText('first second');
    });
    expect(result.current.messages[1]).toMatchObject({
      content: 'first second',
      isStreaming: true,
    });
    expect(pageObserver.mock.calls.map(([text]) => text)).toEqual(['first', 'first second']);

    await act(async () => {
      response.resolve({ kind: 'completed', text: 'first second' });
      await pending;
    });
    expect(result.current.messages[1]).toMatchObject({
      content: 'first second',
      isStreaming: false,
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('finalizes an empty completed response without removing its placeholder', async () => {
    mocks.send.mockResolvedValueOnce({ kind: 'completed', text: '' });
    const { result } = renderHook(() => useAIChat('help'));

    await act(async () => {
      await result.current.sendMessage('question');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      type: 'ai',
      content: '',
      isStreaming: false,
    });
  });

  it('retains partial content when the transport cancels and does not set an error', async () => {
    mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
      options.onText?.('partial response');
      return { kind: 'cancelled', text: 'partial response' };
    });
    const { result } = renderHook(() => useAIChat('aidentist'));

    await act(async () => {
      await result.current.sendMessage('question');
    });

    expect(result.current.messages[1]).toMatchObject({
      content: 'partial response',
      isStreaming: false,
    });
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('removes an empty cancelled placeholder without setting an error', async () => {
    mocks.send.mockResolvedValueOnce({ kind: 'cancelled', text: '' });
    const { result } = renderHook(() => useAIChat('help'));

    await act(async () => {
      await result.current.sendMessage('question');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('retains partial content when the transport rejects an AbortError', async () => {
    mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
      options.onText?.('partial');
      throw new DOMException('The operation was aborted.', 'AbortError');
    });
    const { result } = renderHook(() => useAIChat('help'));

    await act(async () => {
      await result.current.sendMessage('question');
    });

    expect(result.current.messages[1]).toMatchObject({
      content: 'partial',
      isStreaming: false,
    });
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('retains typed partial failures and sets the separate page error', async () => {
    mocks.send.mockRejectedValueOnce(
      new ChatTransportError(
        'network',
        'The chatbot network request failed.',
        undefined,
        'partial',
      ),
    );
    const { result } = renderHook(() => useAIChat('documentationSummarize'));

    await act(async () => {
      await result.current.sendMessage('question');
    });

    expect(result.current.messages[1]).toMatchObject({
      content: 'partial',
      isStreaming: false,
    });
    expect(result.current.error).toBe('The chatbot network request failed.');
    expect(result.current.isLoading).toBe(false);
  });

  it('aborts the active request when the hook unmounts', async () => {
    const response = deferred<{ kind: 'completed'; text: string }>();
    let signal!: AbortSignal;
    mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
      signal = options.signal;
      return response.promise;
    });
    const { result, unmount } = renderHook(() => useAIChat('help'));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('question');
    });
    await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal));

    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      response.resolve({ kind: 'completed', text: 'stale response' });
      await pending;
    });
  });

  it('aborts and replaces the conversation before clearing it', async () => {
    const response = deferred<{ kind: 'completed'; text: string }>();
    let signal!: AbortSignal;
    mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
      signal = options.signal;
      return response.promise;
    });
    const { result } = renderHook(() => useAIChat('triage', 'Initial welcome'));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('question');
    });
    await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal));

    act(() => {
      result.current.clearConversation('Replacement welcome');
    });
    expect(signal.aborted).toBe(true);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      type: 'ai',
      content: 'Replacement welcome',
    });
    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      response.resolve({ kind: 'completed', text: 'stale response' });
      await pending;
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Replacement welcome');
  });

  it('aborts and ignores a stale request when the welcome message replaces the conversation', async () => {
    const response = deferred<{ kind: 'completed'; text: string }>();
    let signal!: AbortSignal;
    let observeText!: (text: string) => void;
    mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
      signal = options.signal;
      observeText = options.onText!;
      return response.promise;
    });
    const { result, rerender } = renderHook(
      ({ welcome }: { welcome: string }) => useAIChat('receptionist', welcome),
      { initialProps: { welcome: 'First welcome' } },
    );

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('question');
    });
    await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal));

    act(() => {
      rerender({ welcome: 'Second welcome' });
    });
    expect(signal.aborted).toBe(true);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Second welcome');

    act(() => {
      observeText('stale text');
    });
    expect(result.current.messages[0].content).toBe('Second welcome');

    await act(async () => {
      response.resolve({ kind: 'completed', text: 'stale response' });
      await pending;
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Second welcome');
  });
});
