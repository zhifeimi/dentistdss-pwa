import { describe, expect, it, vi } from 'vitest';
import {
  readSSEStream,
  SSEObserverError,
  SSEProtocolError,
  SSEReadError,
  type SSEReadResult,
} from '../../src/utils/sseUtils';

const sseResponse = (body: BodyInit | null, contentType = 'text/event-stream'): Response =>
  new Response(body, { headers: { 'content-type': contentType } });

const streamResponse = (
  chunks: Uint8Array[],
  contentType = 'text/event-stream',
): Response => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': contentType } });
};

const encode = (value: string): Uint8Array => new TextEncoder().encode(value);

describe('readSSEStream', () => {
  it('reads LF-delimited events and joins repeated data fields with newlines', async () => {
    const response = sseResponse('data: first\ndata: second\n\ndata: third\n\n');

    await expect(readSSEStream(response)).resolves.toEqual({
      kind: 'completed',
      text: 'first\nsecond third',
    });
  });

  it('reads CRLF-delimited events', async () => {
    const response = sseResponse('data: Hello\r\ndata: world\r\n\r\ndata: !\r\n\r\n');

    await expect(readSSEStream(response)).resolves.toEqual({
      kind: 'completed',
      text: 'Hello\nworld!',
    });
  });

  it('accepts plain text event data', async () => {
    const response = sseResponse('data: plain text\n\n');

    await expect(readSSEStream(response)).resolves.toEqual({
      kind: 'completed',
      text: 'plain text',
    });
  });

  it('parses an OpenAI-shaped chunk using a local wire shape', async () => {
    const chunk = JSON.stringify({ choices: [{ delta: { content: 'Hello' } }] });
    const response = sseResponse(`data: ${chunk}\n\n`);

    await expect(readSSEStream(response)).resolves.toEqual({
      kind: 'completed',
      text: 'Hello',
    });
  });

  it('stops at completion markers without rendering them', async () => {
    const onText = vi.fn();
    const response = sseResponse('data: Hello\n\ndata: [DONE]\n\ndata: ignored\n\n');

    await expect(readSSEStream(response, { onText })).resolves.toEqual({
      kind: 'completed',
      text: 'Hello',
    });
    expect(onText).toHaveBeenCalledTimes(1);
    expect(onText).toHaveBeenCalledWith('Hello');
  });

  it('flushes a split UTF-8 code point at EOF', async () => {
    const bytes = encode('data: hi 🙂\n\n');
    const splitAt = bytes.length - 2;
    const response = streamResponse([bytes.slice(0, splitAt), bytes.slice(splitAt)]);

    await expect(readSSEStream(response)).resolves.toEqual({
      kind: 'completed',
      text: 'hi 🙂',
    });
  });

  it('reports the characterized cumulative text', async () => {
    const response = sseResponse(
      'data: Hello\n\ndata: world\n\ndata: !\n\ndata: [DONE]\n\n',
    );
    const onText = vi.fn();

    const result = await readSSEStream(response, { onText });

    expect(result).toEqual({ kind: 'completed', text: 'Hello world!' });
    expect(onText.mock.calls).toEqual([
      ['Hello'],
      ['Hello world'],
      ['Hello world!'],
    ]);
  });

  it('preserves the existing punctuation and spacing characterization', async () => {
    const response = sseResponse('data: Hello\n\ndata: ,\n\ndata:  world\n\n');

    await expect(readSSEStream(response)).resolves.toEqual({
      kind: 'completed',
      text: 'Hello, world',
    });
  });

  it('returns partial text on cancellation and cancels and releases the reader', async () => {
    let readCount = 0;
    let resolvePendingRead: (result: ReadableStreamReadResult<Uint8Array>) => void = () => {};
    const cancel = vi.fn(async () => {
      resolvePendingRead({ done: true, value: undefined });
    });
    const releaseLock = vi.fn();
    const reader: ReadableStreamDefaultReader<Uint8Array> = {
      read: vi.fn(() => {
        readCount += 1;
        if (readCount === 1) {
          return Promise.resolve({ done: false, value: encode('data: partial\n\n') });
        }
        return new Promise((resolve) => {
          resolvePendingRead = resolve;
        });
      }),
      cancel,
      releaseLock,
      closed: Promise.resolve(),
    };
    const response = {
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: { getReader: () => reader },
    } as unknown as Response;
    const controller = new AbortController();
    const onText = vi.fn(() => controller.abort());

    const result = await readSSEStream(response, { signal: controller.signal, onText });

    expect(result).toEqual({ kind: 'cancelled', text: 'partial' });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(releaseLock).toHaveBeenCalledTimes(1);
  });

  it('wraps a reader failure with the partial text', async () => {
    const cause = new Error('socket closed');
    let readCount = 0;
    const releaseLock = vi.fn();
    const reader: ReadableStreamDefaultReader<Uint8Array> = {
      read: vi.fn(() => {
        readCount += 1;
        if (readCount === 1) {
          return Promise.resolve({ done: false, value: encode('data: partial\n\n') });
        }
        return Promise.reject(cause);
      }),
      cancel: vi.fn(async () => {}),
      releaseLock,
      closed: Promise.resolve(),
    };
    const response = {
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: { getReader: () => reader },
    } as unknown as Response;

    await expect(readSSEStream(response)).rejects.toMatchObject({
      name: 'SSEReadError',
      partialText: 'partial',
      cause,
    } satisfies Partial<SSEReadError>);
    expect(releaseLock).toHaveBeenCalledTimes(1);
  });

  it('wraps observer failure after cancelling the reader', async () => {
    const cause = new Error('observer failed');
    const cancel = vi.fn(async () => {});
    const releaseLock = vi.fn();
    const reader: ReadableStreamDefaultReader<Uint8Array> = {
      read: vi.fn(() => Promise.resolve({ done: false, value: encode('data: partial\n\n') })),
      cancel,
      releaseLock,
      closed: Promise.resolve(),
    };
    const response = {
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: { getReader: () => reader },
    } as unknown as Response;

    await expect(
      readSSEStream(response, { onText: () => { throw cause; } }),
    ).rejects.toMatchObject({
      name: 'SSEObserverError',
      partialText: 'partial',
      cause,
    } satisfies Partial<SSEObserverError>);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(releaseLock).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid response protocol without logging', async () => {
    const warn = vi.spyOn(console, 'warn');
    const response = sseResponse('', 'application/json');

    await expect(readSSEStream(response)).rejects.toBeInstanceOf(SSEProtocolError);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('rejects a response without a readable body', async () => {
    const response = sseResponse(null);

    await expect(readSSEStream(response)).rejects.toBeInstanceOf(SSEProtocolError);
  });

  it('rejects a valid JSON event that is not an OpenAI-shaped chunk', async () => {
    const response = sseResponse('data: {"unexpected":true}\n\n');

    await expect(readSSEStream(response)).rejects.toBeInstanceOf(SSEProtocolError);
  });

  it('returns the explicit result union for a normal stream', async () => {
    const result: SSEReadResult = await readSSEStream(sseResponse('data: ok\n\n'));

    expect(result.kind).toBe('completed');
  });
});
