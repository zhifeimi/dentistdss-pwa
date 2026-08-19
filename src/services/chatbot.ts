import {
  fetchStreamingExchange,
  type StreamingExchange,
  type StreamingExchangeRequest,
} from './chatbotStream';
import { session } from './session';
import {
  readSSEStream,
  SSEObserverError,
  SSEProtocolError,
  SSEReadError,
} from '../utils/sseUtils';

export const CHATBOT_AGENTS = [
  'help',
  'aidentist',
  'receptionist',
  'triage',
  'documentationSummarize',
] as const;

export type ChatbotAgent = typeof CHATBOT_AGENTS[number];

export interface ChatbotSendOptions {
  signal?: AbortSignal;
  onText?: (text: string) => void;
}

export type ChatbotResult =
  | { kind: 'completed'; text: string }
  | { kind: 'cancelled'; text: string };

export type ChatTransportErrorCode =
  | 'invalid-input'
  | 'authentication-required'
  | 'unauthorized'
  | 'rate-limited'
  | 'http'
  | 'network'
  | 'protocol'
  | 'observer-failed'
  | 'session-ended';

export class ChatTransportError extends Error {
  override readonly name = 'ChatTransportError';

  constructor(
    readonly code: ChatTransportErrorCode,
    message: string,
    readonly status?: number,
    readonly partialText?: string,
  ) {
    super(message);
  }
}

export interface ChatbotModule {
  send(
    agent: ChatbotAgent,
    prompt: string,
    options?: ChatbotSendOptions,
  ): Promise<ChatbotResult>;
}

type AgentConfig = {
  endpoint: string;
  auth: 'optional' | 'required';
};

const AGENT_CONFIG: Record<ChatbotAgent, AgentConfig> = {
  help: { endpoint: '/help', auth: 'optional' },
  aidentist: { endpoint: '/aidentist', auth: 'required' },
  receptionist: { endpoint: '/receptionist', auth: 'required' },
  triage: { endpoint: '/triage', auth: 'required' },
  documentationSummarize: {
    endpoint: '/documentation/summarize',
    auth: 'required',
  },
};

const BASE_HEADERS = {
  'Content-Type': 'text/plain',
  Accept: 'text/event-stream',
  'Cache-Control': 'no-cache',
} as const;

const errorMessages = {
  invalidInput: 'Invalid chatbot request.',
  authenticationRequired: 'Authentication is required for this chatbot.',
  unauthorized: 'The chatbot request was unauthorized.',
  rateLimited: 'The chatbot request was rate limited.',
  http: 'The chatbot request failed.',
  network: 'The chatbot network request failed.',
  protocol: 'The chatbot stream had an invalid protocol.',
  observer: 'The chatbot text observer failed.',
  sessionEnded: 'The chatbot session ended.',
} as const;

type Cancellation = { kind: 'cancelled' };

type ResponseOrCancellation = Response | Cancellation;

type Settled<T> = { kind: 'fulfilled'; value: T } | { kind: 'rejected'; error: unknown };

const isCancellation = (value: ResponseOrCancellation): value is Cancellation =>
  'kind' in value && value.kind === 'cancelled';

const isChatbotAgent = (value: string): value is ChatbotAgent =>
  (CHATBOT_AGENTS as readonly string[]).includes(value);

const makeHeaders = (
  bearer: ReturnType<typeof session.getBearerSession>,
): Record<string, string> => {
  const headers: Record<string, string> = { ...BASE_HEADERS };
  if (bearer) {
    headers.Authorization = `${bearer.tokenType} ${bearer.accessToken}`;
  }
  return headers;
};

const raceWithCancellation = async <T>(
  operation: Promise<T>,
  signal: AbortSignal | undefined,
): Promise<T | Cancellation> => {
  if (!signal) {
    return operation;
  }
  if (signal.aborted) {
    operation.catch(() => undefined);
    return { kind: 'cancelled' };
  }

  let abort: (() => void) | undefined;
  const cancellation = new Promise<Cancellation>((resolve) => {
    abort = () => resolve({ kind: 'cancelled' });
    signal.addEventListener('abort', abort, { once: true });
  });
  operation.catch(() => undefined);

  try {
    return await Promise.race([operation, cancellation]);
  } finally {
    if (abort) {
      signal.removeEventListener('abort', abort);
    }
  }
};

const settledRefresh = (refreshPromise: Promise<unknown>): Promise<Settled<unknown>> =>
  refreshPromise.then(
    (value) => ({ kind: 'fulfilled', value }),
    (error) => ({ kind: 'rejected', error }),
  );

const request = (
  exchange: StreamingExchange,
  endpoint: string,
  prompt: string,
  bearer: ReturnType<typeof session.getBearerSession>,
  signal: AbortSignal | undefined,
): Promise<Response> => {
  const exchangeRequest: StreamingExchangeRequest = {
    body: prompt,
    headers: makeHeaders(bearer),
    signal,
  };
  return Promise.resolve().then(() => exchange.post(endpoint, exchangeRequest));
};

const mapHttpError = (response: Response): ChatTransportError => {
  if (response.status === 429) {
    return new ChatTransportError('rate-limited', errorMessages.rateLimited, response.status);
  }
  return new ChatTransportError('http', errorMessages.http, response.status);
};

const requestOrNetworkError = async (
  exchange: StreamingExchange,
  endpoint: string,
  prompt: string,
  bearer: ReturnType<typeof session.getBearerSession>,
  signal: AbortSignal | undefined,
): Promise<Response | Cancellation> => {
  try {
    return await raceWithCancellation(
      request(exchange, endpoint, prompt, bearer, signal),
      signal,
    );
  } catch (_) {
    if (signal?.aborted) {
      return { kind: 'cancelled' };
    }
    throw new ChatTransportError('network', errorMessages.network);
  }
};

const readResponse = async (
  response: Response,
  signal: AbortSignal | undefined,
  onText: ((text: string) => void) | undefined,
): Promise<ChatbotResult> => {
  try {
    return await readSSEStream(response, { signal, onText });
  } catch (error) {
    if (error instanceof SSEObserverError) {
      throw new ChatTransportError(
        'observer-failed',
        errorMessages.observer,
        undefined,
        error.partialText,
      );
    }
    if (error instanceof SSEProtocolError) {
      throw new ChatTransportError('protocol', errorMessages.protocol);
    }
    if (error instanceof SSEReadError) {
      throw new ChatTransportError('network', errorMessages.network, undefined, error.partialText);
    }
    throw new ChatTransportError('network', errorMessages.network);
  }
};

const createModule = (exchange: StreamingExchange): ChatbotModule => ({
  async send(agent, prompt, options = {}): Promise<ChatbotResult> {
    if (!isChatbotAgent(agent) || typeof prompt !== 'string') {
      throw new ChatTransportError('invalid-input', errorMessages.invalidInput);
    }

    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) {
      throw new ChatTransportError('invalid-input', errorMessages.invalidInput);
    }

    const { signal, onText } = options;
    if (signal?.aborted) {
      return { kind: 'cancelled', text: '' };
    }

    const agentConfig = AGENT_CONFIG[agent];
    const initialBearer = session.getBearerSession();
    if (agentConfig.auth === 'required' && !initialBearer) {
      throw new ChatTransportError(
        'authentication-required',
        errorMessages.authenticationRequired,
      );
    }

    const firstResponse = await requestOrNetworkError(
      exchange,
      agentConfig.endpoint,
      normalizedPrompt,
      initialBearer,
      signal,
    );
    if (isCancellation(firstResponse)) {
      return { kind: 'cancelled', text: '' };
    }

    if (firstResponse.ok) {
      return readResponse(firstResponse, signal, onText);
    }

    if (firstResponse.status !== 401 || !initialBearer) {
      if (firstResponse.status === 401) {
        throw new ChatTransportError('unauthorized', errorMessages.unauthorized, 401);
      }
      throw mapHttpError(firstResponse);
    }

    const refreshPromise = Promise.resolve().then(() => session.refreshSession());
    const refreshResult = await raceWithCancellation(
      settledRefresh(refreshPromise),
      signal,
    );
    if ('kind' in refreshResult && refreshResult.kind === 'cancelled') {
      return { kind: 'cancelled', text: '' };
    }
    if (refreshResult.kind === 'rejected') {
      session.terminateSession({ redirect: true });
      throw new ChatTransportError('session-ended', errorMessages.sessionEnded, 401);
    }

    if (signal?.aborted) {
      return { kind: 'cancelled', text: '' };
    }
    const rotatedBearer = session.getBearerSession();
    if (!rotatedBearer) {
      session.terminateSession({ redirect: true });
      throw new ChatTransportError('session-ended', errorMessages.sessionEnded, 401);
    }
    if (signal?.aborted) {
      return { kind: 'cancelled', text: '' };
    }

    const replayResponse = await requestOrNetworkError(
      exchange,
      agentConfig.endpoint,
      normalizedPrompt,
      rotatedBearer,
      signal,
    );
    if (isCancellation(replayResponse)) {
      return { kind: 'cancelled', text: '' };
    }
    if (replayResponse.status === 401) {
      session.terminateSession({ redirect: true });
      throw new ChatTransportError('session-ended', errorMessages.sessionEnded, 401);
    }
    if (!replayResponse.ok) {
      throw mapHttpError(replayResponse);
    }

    return readResponse(replayResponse, signal, onText);
  },
});

export const createChatbotModule = (exchange: StreamingExchange = fetchStreamingExchange): ChatbotModule =>
  createModule(exchange);

const chatbotAPI: ChatbotModule = createChatbotModule();

export type {
  StreamingExchange,
  StreamingExchangeRequest,
} from './chatbotStream';

export default chatbotAPI;
