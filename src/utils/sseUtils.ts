export type SSEReadResult =
  | { kind: 'completed'; text: string }
  | { kind: 'cancelled'; text: string };

export interface SSEReadOptions {
  signal?: AbortSignal;
  onText?: (text: string) => void;
}

export class SSEProtocolError extends Error {
  override readonly name = 'SSEProtocolError';

  constructor(message = 'Invalid SSE response.') {
    super(message);
  }
}

export class SSEObserverError extends Error {
  override readonly name = 'SSEObserverError';

  constructor(readonly partialText: string, override readonly cause: unknown) {
    super('SSE text observer failed.');
  }
}

export class SSEReadError extends Error {
  override readonly name = 'SSEReadError';

  constructor(readonly partialText: string, override readonly cause: unknown) {
    super('SSE stream read failed.');
  }
}

interface RenderToken {
  content: string;
  complete: boolean;
}

const EVENT_DELIMITER = /\r\n\r\n|\n\n|\r\r/;
const ABORTED = Symbol('sse-aborted');

type EventRecord = {
  type: string;
  data: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseEvent = (eventBlock: string): EventRecord | undefined => {
  const dataLines: string[] = [];
  let type = 'message';

  for (const line of eventBlock.split(/\r\n|\r|\n/)) {
    if (!line || line.startsWith(':')) {
      continue;
    }

    const separator = line.indexOf(':');
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? '' : line.slice(separator + 1).trim();

    if (field === 'data') {
      dataLines.push(value);
    } else if (field === 'event') {
      type = value;
    }
  }

  if (dataLines.length === 0) {
    return undefined;
  }

  return { type, data: dataLines.join('\n') };
};

const findEvent = (buffer: string): { block: string; rest: string } | undefined => {
  const delimiter = EVENT_DELIMITER.exec(buffer);
  if (!delimiter || delimiter.index < 0) {
    return undefined;
  }

  return {
    block: buffer.slice(0, delimiter.index),
    rest: buffer.slice(delimiter.index + delimiter[0].length),
  };
};

const parseChunk = (data: string): RenderToken => {
  const marker = data.trim();
  if (marker === '[DONE]' || marker === 'null') {
    return { content: '', complete: true };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch (_) {
    return { content: data, complete: false };
  }

  if (parsed === null) {
    return { content: '', complete: true };
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.choices) || parsed.choices.length === 0) {
    throw new SSEProtocolError('Invalid SSE data shape.');
  }

  const choice = parsed.choices[0];
  if (!isRecord(choice)) {
    throw new SSEProtocolError('Invalid SSE choice shape.');
  }

  const delta = choice.delta;
  if (delta !== undefined && !isRecord(delta)) {
    throw new SSEProtocolError('Invalid SSE delta shape.');
  }

  const rawContent = delta?.content;
  if (rawContent !== undefined && rawContent !== null && typeof rawContent !== 'string') {
    throw new SSEProtocolError('Invalid SSE content shape.');
  }
  const content = typeof rawContent === 'string' ? rawContent : '';
  const finishReason = choice.finish_reason;
  if (finishReason !== undefined && finishReason !== null && typeof finishReason !== 'string') {
    throw new SSEProtocolError('Invalid SSE finish reason.');
  }

  if (delta === undefined && finishReason === undefined) {
    throw new SSEProtocolError('Invalid SSE choice shape.');
  }

  return {
    content,
    complete: finishReason !== undefined && finishReason !== null,
  };
};

// This predicate intentionally preserves the spacing behavior of the former reader.
const needsRenderedSpace = (currentText: string, incomingText: string): boolean =>
  currentText.length > 0 &&
  !incomingText.match(/^[.,!?;:)}\]"']/) &&
  !currentText.match(/[(\[{"'\s]$/);

const renderEvent = (
  event: EventRecord,
  currentText: string,
  onText?: (text: string) => void,
): { text: string; complete: boolean } => {
  if (event.type !== 'message') {
    throw new SSEProtocolError('Invalid SSE event type.');
  }

  const token = parseChunk(event.data);
  let text = currentText;
  if (token.content) {
    text += needsRenderedSpace(text, token.content) ? ` ${token.content}` : token.content;
    if (onText) {
      try {
        onText(text);
      } catch (cause) {
        throw new SSEObserverError(text, cause);
      }
    }
  }

  return { text, complete: token.complete };
};

const cancelReader = async (reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> => {
  try {
    await reader.cancel();
  } catch (_) {
    // The original cancellation or stream failure remains the useful error.
  }
};

const readWithAbort = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal | undefined,
): Promise<ReadableStreamReadResult<Uint8Array>> => {
  if (!signal) {
    return reader.read();
  }
  if (signal.aborted) {
    throw ABORTED;
  }

  let abort: (() => void) | undefined;
  const readPromise = reader.read();
  // A cancellation can return before the underlying read settles. Consume a
  // later rejection so an abort does not create an unhandled reader promise.
  readPromise.catch(() => undefined);
  const abortPromise = new Promise<never>((_, reject) => {
    abort = () => reject(ABORTED);
    signal.addEventListener('abort', abort, { once: true });
  });

  try {
    return await Promise.race([readPromise, abortPromise]);
  } finally {
    if (abort) {
      signal.removeEventListener('abort', abort);
    }
  }
};

const validateResponse = (response: Response): void => {
  const contentType = response.headers.get('content-type')?.toLowerCase();
  if (!contentType?.includes('text/event-stream')) {
    throw new SSEProtocolError('Expected text/event-stream response.');
  }
  if (!response.body) {
    throw new SSEProtocolError('Response body is not readable.');
  }
};

export async function readSSEStream(
  response: Response,
  options: SSEReadOptions = {},
): Promise<SSEReadResult> {
  validateResponse(response);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let readerWasCancelled = false;

  const cancel = async (): Promise<void> => {
    if (!readerWasCancelled) {
      readerWasCancelled = true;
      await cancelReader(reader);
    }
  };

  const processBlock = (block: string): boolean => {
    const event = parseEvent(block);
    if (!event) {
      return false;
    }
    const rendered = renderEvent(event, text, options.onText);
    text = rendered.text;
    return rendered.complete;
  };

  try {
    if (options.signal?.aborted) {
      await cancel();
      return { kind: 'cancelled', text };
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await readWithAbort(reader, options.signal);
      } catch (cause) {
        if (cause === ABORTED || options.signal?.aborted) {
          await cancel();
          return { kind: 'cancelled', text };
        }
        throw new SSEReadError(text, cause);
      }

      if (options.signal?.aborted) {
        await cancel();
        return { kind: 'cancelled', text };
      }

      if (result.done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(result.value, { stream: true });
      let nextEvent = findEvent(buffer);
      while (nextEvent) {
        buffer = nextEvent.rest;
        if (processBlock(nextEvent.block)) {
          return { kind: 'completed', text };
        }
        if (options.signal?.aborted) {
          await cancel();
          return { kind: 'cancelled', text };
        }
        nextEvent = findEvent(buffer);
      }
    }

    if (buffer.trim()) {
      processBlock(buffer);
    }

    return { kind: 'completed', text };
  } catch (error) {
    if (error instanceof SSEObserverError) {
      await cancel();
      throw error;
    }
    if (error instanceof SSEProtocolError) {
      await cancel();
      throw error;
    }
    if (error instanceof SSEReadError) {
      throw error;
    }
    if (error === ABORTED || options.signal?.aborted) {
      await cancel();
      return { kind: 'cancelled', text };
    }
    throw new SSEReadError(text, error);
  } finally {
    reader.releaseLock();
  }
}
