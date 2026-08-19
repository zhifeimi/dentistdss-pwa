import config from '../config';

export interface StreamingExchangeRequest {
  body: string;
  headers: Record<string, string>;
  signal?: AbortSignal;
}

export interface StreamingExchange {
  post(endpoint: string, request: StreamingExchangeRequest): Promise<Response>;
}

export const fetchStreamingExchange: StreamingExchange = {
  post: (endpoint, request) =>
    fetch(`${config.api.baseUrl}/api/genai/chatbot${endpoint}`, {
      method: 'POST',
      headers: request.headers,
      body: request.body,
      signal: request.signal,
      credentials: 'include',
    }),
};
