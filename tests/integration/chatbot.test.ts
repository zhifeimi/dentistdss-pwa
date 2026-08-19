import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChatTransportError,
  CHATBOT_AGENTS,
  createChatbotModule,
  type ChatbotAgent,
} from '../../src/services/chatbot';
import type {
  StreamingExchange,
  StreamingExchangeRequest,
} from '../../src/services/chatbotStream';

const sessionMocks = vi.hoisted(() => {
  class SessionRefreshSupersededError extends Error {
    override readonly name = 'SessionRefreshSupersededError';
  }

  return {
    getBearerSession: vi.fn(),
    refreshSession: vi.fn(),
    terminateSession: vi.fn(),
    SessionRefreshSupersededError,
  };
});

vi.mock('../../src/services/session', () => ({
  session: sessionMocks,
  SessionRefreshSupersededError: sessionMocks.SessionRefreshSupersededError,
}));

const exchange: StreamingExchange = {
  post: vi.fn(),
};

const response = (
  body: string,
  status = 200,
  headers: Record<string, string> = { 'content-type': 'text/event-stream' },
): Response => new Response(body, { status, headers });

const stream = (text: string): Response => response(`data: ${text}\n\n`);

const deferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const expectTransportError = async (
  promise: Promise<unknown>,
  code: ChatTransportError['code'],
): Promise<ChatTransportError> => {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(ChatTransportError);
  expect(error).toMatchObject({ code });
  return error as ChatTransportError;
};

describe('ChatbotModule', () => {
  const chatbot = createChatbotModule(exchange);

  beforeEach(() => {
    vi.resetAllMocks();
    sessionMocks.getBearerSession.mockReturnValue(undefined);
    sessionMocks.refreshSession.mockResolvedValue({ accessToken: 'rotated-token' });
    sessionMocks.terminateSession.mockImplementation(() => {});
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(stream('ok'));
  });

  it('maps every public agent to its exact backend endpoint', async () => {
    const expected = {
      help: '/help',
      aidentist: '/aidentist',
      receptionist: '/receptionist',
      triage: '/triage',
      documentationSummarize: '/documentation/summarize',
    } as const;
    sessionMocks.getBearerSession.mockReturnValue({ accessToken: 'token', tokenType: 'Bearer' });

    for (const agent of CHATBOT_AGENTS) {
      await chatbot.send(agent, 'question');
    }

    expect((exchange.post as ReturnType<typeof vi.fn>).mock.calls.map(([endpoint]) => endpoint)).toEqual(
      CHATBOT_AGENTS.map((agent) => expected[agent]),
    );
  });

  it('trims prompts and rejects an empty prompt before I/O', async () => {
    await expectTransportError(chatbot.send('help', '  '), 'invalid-input');
    expect(exchange.post).not.toHaveBeenCalled();

    await chatbot.send('help', '\n question \t');
    expect(exchange.post.mock.calls[0][1]).toMatchObject({ body: 'question' });

    await expectTransportError(chatbot.send('not-an-agent' as ChatbotAgent, 'question'), 'invalid-input');
    expect(exchange.post).toHaveBeenCalledTimes(1);
  });

  it('sends anonymous help without a bearer token', async () => {
    await chatbot.send('help', 'How do I book?');

    expect(exchange.post).toHaveBeenCalledWith(
      '/help',
      expect.objectContaining({
        body: 'How do I book?',
        headers: expect.objectContaining({
          'Content-Type': 'text/plain',
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        }),
      }),
    );
    expect(exchange.post.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('opportunistically includes a bearer token on help', async () => {
    sessionMocks.getBearerSession.mockReturnValue({ accessToken: 'help-token', tokenType: 'Bearer' });

    await chatbot.send('help', 'question');

    expect(exchange.post.mock.calls[0][1].headers).toMatchObject({
      Authorization: 'Bearer help-token',
    });
  });

  it('fails required agents locally when no bearer is available', async () => {
    for (const agent of ['aidentist', 'receptionist', 'triage', 'documentationSummarize'] as const) {
      await expectTransportError(chatbot.send(agent, 'question'), 'authentication-required');
    }

    expect(exchange.post).not.toHaveBeenCalled();
  });

  it('forwards credentials, headers, body, and the caller signal', async () => {
    const controller = new AbortController();
    sessionMocks.getBearerSession.mockReturnValue({ accessToken: 'token', tokenType: 'Token' });

    await chatbot.send('aidentist', '  question  ', { signal: controller.signal });

    const request = exchange.post.mock.calls[0][1] as StreamingExchangeRequest;
    expect(request).toEqual({
      body: 'question',
      signal: controller.signal,
      headers: {
        'Content-Type': 'text/plain',
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
        Authorization: 'Token token',
      },
    });
  });

  it('refreshes once after a bearer 401 and replays with the rotated bearer', async () => {
    const oldBearer = { accessToken: 'old-token', tokenType: 'Bearer' };
    const rotatedBearer = { accessToken: 'new-token', tokenType: 'Bearer' };
    sessionMocks.getBearerSession.mockReturnValueOnce(oldBearer).mockReturnValueOnce(rotatedBearer);
    (exchange.post as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(response('private body', 401, { 'content-type': 'text/plain' }))
      .mockResolvedValueOnce(stream('replayed'));

    const result = await chatbot.send('aidentist', 'question');

    expect(result).toEqual({ kind: 'completed', text: 'replayed' });
    expect(sessionMocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(exchange.post).toHaveBeenCalledTimes(2);
    expect(exchange.post.mock.calls[1][1].headers).toMatchObject({
      Authorization: 'Bearer new-token',
    });
  });

  it('does not refresh, broadcast, or redirect after anonymous help receives 401', async () => {
    const failedResponse = response('do not expose this body', 401, { 'content-type': 'text/plain' });
    const bodySpy = vi.spyOn(failedResponse, 'text');
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(failedResponse);

    const error = await expectTransportError(chatbot.send('help', 'question'), 'unauthorized');

    expect(error.message).not.toContain('do not expose this body');
    expect(bodySpy).not.toHaveBeenCalled();
    expect(sessionMocks.refreshSession).not.toHaveBeenCalled();
    expect(sessionMocks.terminateSession).not.toHaveBeenCalled();
  });

  it('rejects a superseded request without replaying it under the newer bearer', async () => {
    const oldBearer = { accessToken: 'old-token', tokenType: 'Bearer' };
    const newerBearer = { accessToken: 'newer-token', tokenType: 'Bearer' };
    sessionMocks.getBearerSession
      .mockReturnValueOnce(oldBearer)
      .mockReturnValue(newerBearer);
    sessionMocks.refreshSession.mockRejectedValue(
      new sessionMocks.SessionRefreshSupersededError('Session refresh superseded.'),
    );
    const failedResponse = response('private mutation details', 401);
    const bodySpy = vi.spyOn(failedResponse, 'text');
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(failedResponse);

    const error = await expectTransportError(chatbot.send('aidentist', 'change password'), 'unauthorized');

    expect(error.status).toBe(401);
    expect(error.message).not.toContain('private mutation details');
    expect(bodySpy).not.toHaveBeenCalled();
    expect(sessionMocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(exchange.post).toHaveBeenCalledTimes(1);
    expect(exchange.post.mock.calls[0][1].headers).toMatchObject({
      Authorization: 'Bearer old-token',
    });
    expect(sessionMocks.getBearerSession()).toEqual(newerBearer);
    expect(sessionMocks.terminateSession).not.toHaveBeenCalled();
  });

  it('does not repeat termination when a superseded refresh finds no bearer', async () => {
    sessionMocks.getBearerSession
      .mockReturnValueOnce({ accessToken: 'old-token', tokenType: 'Bearer' })
      .mockReturnValueOnce(undefined);
    sessionMocks.refreshSession.mockRejectedValue(
      new sessionMocks.SessionRefreshSupersededError('Session refresh superseded.'),
    );
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(response('private', 401));

    const error = await expectTransportError(chatbot.send('aidentist', 'question'), 'unauthorized');

    expect(error.status).toBe(401);
    expect(sessionMocks.terminateSession).not.toHaveBeenCalled();
    expect(exchange.post).toHaveBeenCalledTimes(1);
  });

  it('terminates immediately when refresh fails', async () => {
    sessionMocks.getBearerSession.mockReturnValue({ accessToken: 'old-token', tokenType: 'Bearer' });
    sessionMocks.refreshSession.mockRejectedValue(new Error('secret refresh detail'));
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(response('private', 401));

    const error = await expectTransportError(chatbot.send('aidentist', 'question'), 'session-ended');

    expect(error.message).not.toContain('secret refresh detail');
    expect(sessionMocks.terminateSession).toHaveBeenCalledWith({ redirect: true });
    expect(exchange.post).toHaveBeenCalledTimes(1);
  });

  it('terminates immediately when the replay also receives 401', async () => {
    sessionMocks.getBearerSession
      .mockReturnValueOnce({ accessToken: 'old-token', tokenType: 'Bearer' })
      .mockReturnValueOnce({ accessToken: 'new-token', tokenType: 'Bearer' });
    (exchange.post as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(response('first', 401))
      .mockResolvedValueOnce(response('second', 401));

    await expectTransportError(chatbot.send('aidentist', 'question'), 'session-ended');

    expect(sessionMocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(sessionMocks.terminateSession).toHaveBeenCalledTimes(1);
    expect(sessionMocks.terminateSession).toHaveBeenCalledWith({ redirect: true });
  });

  it('cancels before fetch without invoking the exchange', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(chatbot.send('help', 'question', { signal: controller.signal })).resolves.toEqual({
      kind: 'cancelled',
      text: '',
    });
    expect(exchange.post).not.toHaveBeenCalled();
  });

  it('cancels during refresh without cancelling the shared refresh promise', async () => {
    const controller = new AbortController();
    const refresh = deferred<{ accessToken: string }>();
    sessionMocks.getBearerSession.mockReturnValue({ accessToken: 'old-token', tokenType: 'Bearer' });
    sessionMocks.refreshSession.mockReturnValue(refresh.promise);
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(response('first', 401));

    const pending = chatbot.send('aidentist', 'question', { signal: controller.signal });
    await vi.waitFor(() => expect(sessionMocks.refreshSession).toHaveBeenCalledTimes(1));
    controller.abort();

    await expect(pending).resolves.toEqual({ kind: 'cancelled', text: '' });
    refresh.resolve({ accessToken: 'rotated-token' });
    await refresh.promise;
    expect(exchange.post).toHaveBeenCalledTimes(1);
  });

  it('cancels before replay when the caller aborts after refresh', async () => {
    const controller = new AbortController();
    sessionMocks.getBearerSession
      .mockReturnValueOnce({ accessToken: 'old-token', tokenType: 'Bearer' })
      .mockImplementationOnce(() => {
        controller.abort();
        return { accessToken: 'new-token', tokenType: 'Bearer' };
      });
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(response('first', 401));

    await expect(chatbot.send('aidentist', 'question', { signal: controller.signal })).resolves.toEqual({
      kind: 'cancelled',
      text: '',
    });
    expect(exchange.post).toHaveBeenCalledTimes(1);
  });

  it('lets a shared refresh continue when one cancelled caller exits', async () => {
    const firstController = new AbortController();
    const refresh = deferred<{ accessToken: string }>();
    sessionMocks.getBearerSession.mockReturnValue({ accessToken: 'old-token', tokenType: 'Bearer' });
    sessionMocks.refreshSession.mockReturnValue(refresh.promise);
    (exchange.post as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(response('first', 401))
      .mockResolvedValueOnce(response('second', 401))
      .mockResolvedValueOnce(stream('survivor'));

    const first = chatbot.send('aidentist', 'first', { signal: firstController.signal });
    const second = chatbot.send('aidentist', 'second');
    await vi.waitFor(() => expect(sessionMocks.refreshSession).toHaveBeenCalledTimes(2));
    firstController.abort();
    await expect(first).resolves.toEqual({ kind: 'cancelled', text: '' });

    sessionMocks.getBearerSession.mockReturnValue({ accessToken: 'new-token', tokenType: 'Bearer' });
    refresh.resolve({ accessToken: 'new-token' });
    await expect(second).resolves.toEqual({ kind: 'completed', text: 'survivor' });
    expect(exchange.post).toHaveBeenCalledTimes(3);
  });

  it('cancels during streaming and retains partial text', async () => {
    const controller = new AbortController();
    let resolveRead: (value: ReadableStreamReadResult<Uint8Array>) => void = () => {};
    let reads = 0;
    const reader = {
      read: vi.fn(() => {
        reads += 1;
        if (reads === 1) {
          return Promise.resolve({ done: false, value: new TextEncoder().encode('data: partial\n\n') });
        }
        return new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) => {
          resolveRead = resolve;
        });
      }),
      cancel: vi.fn(async () => resolveRead({ done: true, value: undefined })),
      releaseLock: vi.fn(),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: { getReader: () => reader },
    } as unknown as Response);
    const onText = vi.fn(() => controller.abort());

    await expect(chatbot.send('help', 'question', { signal: controller.signal, onText })).resolves.toEqual({
      kind: 'cancelled',
      text: 'partial',
    });
    expect(reader.cancel).toHaveBeenCalledTimes(1);
    expect(reader.releaseLock).toHaveBeenCalledTimes(1);
  });

  it('maps rate limits and ordinary HTTP errors without reading response bodies', async () => {
    const rateResponse = response('rate body', 429, { 'content-type': 'text/plain' });
    const httpResponse = response('server secret', 500, { 'content-type': 'text/plain' });
    const rateText = vi.spyOn(rateResponse, 'text');
    const httpText = vi.spyOn(httpResponse, 'text');
    (exchange.post as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(rateResponse)
      .mockResolvedValueOnce(httpResponse);

    const rateError = await expectTransportError(chatbot.send('help', 'one'), 'rate-limited');
    const httpError = await expectTransportError(chatbot.send('help', 'two'), 'http');

    expect(rateError.status).toBe(429);
    expect(httpError.status).toBe(500);
    expect(rateError.message).not.toContain('rate body');
    expect(httpError.message).not.toContain('server secret');
    expect(rateText).not.toHaveBeenCalled();
    expect(httpText).not.toHaveBeenCalled();
  });

  it('maps exchange failures to a sanitized network error', async () => {
    (exchange.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('raw socket secret'));

    const error = await expectTransportError(chatbot.send('help', 'question'), 'network');

    expect(error.message).not.toContain('raw socket secret');
  });

  it('maps protocol errors to a sanitized protocol error', async () => {
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(response('not sse', 200, {
      'content-type': 'application/json',
    }));

    const error = await expectTransportError(chatbot.send('help', 'question'), 'protocol');

    expect(error.message).not.toContain('not sse');
  });

  it('retains streamed text when a later chunk violates the protocol', async () => {
    const validChunk = JSON.stringify({ choices: [{ delta: { content: 'partial' } }] });
    const malformedChunk = JSON.stringify({ choices: [{ delta: { content: 123 } }] });
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue(
      response(`data: ${validChunk}\n\ndata: ${malformedChunk}\n\n`),
    );

    const error = await expectTransportError(chatbot.send('help', 'question'), 'protocol');

    expect(error.partialText).toBe('partial');
    expect(error.message).not.toContain('123');
  });

  it('maps observer errors and retains partial text', async () => {
    const cause = new Error('UI observer detail');
    const error = await expectTransportError(
      chatbot.send('help', 'question', { onText: () => { throw cause; } }),
      'observer-failed',
    );

    expect(error.partialText).toBe('ok');
    expect(error.message).not.toContain('UI observer detail');
  });

  it('maps mid-stream reader failures and retains partial text', async () => {
    let readCount = 0;
    const cause = new Error('raw stream detail');
    const reader = {
      read: vi.fn(() => {
        readCount += 1;
        return readCount === 1
          ? Promise.resolve({ done: false, value: new TextEncoder().encode('data: partial\n\n') })
          : Promise.reject(cause);
      }),
      cancel: vi.fn(async () => {}),
      releaseLock: vi.fn(),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
    (exchange.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: { getReader: () => reader },
    } as unknown as Response);

    const error = await expectTransportError(chatbot.send('help', 'question'), 'network');

    expect(error.partialText).toBe('partial');
    expect(error.message).not.toContain('raw stream detail');
  });

  it('does not dispatch chatbot snackbars', async () => {
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    (exchange.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

    await expectTransportError(chatbot.send('help', 'question'), 'network');

    expect(dispatch).not.toHaveBeenCalled();
    dispatch.mockRestore();
  });
});
