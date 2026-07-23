import config from '../config';
import {
  broadcastSessionEnded,
  clearBearerSession,
  clearXsrfToken,
  getBearerSession,
  redirectToLogin,
  refreshSession,
} from './config';
import { createEnhancedSSEReader, formatSSEError, TokenCallback } from '../utils/sseUtils';

/**
 * Chatbot API service with enhanced SSE processing
 *
 * This service communicates with the Spring AI backend which handles all OpenAI API interactions.
 * The frontend uses OpenAI SDK utilities for improved SSE data processing and type safety.
 *
 * Features:
 * - Enhanced SSE (Server-Sent Events) streaming response handling
 * - Type safety using OpenAI SDK TypeScript definitions
 * - Improved token parsing and message formatting
 * - Session management through backend JWT authentication
 * - All OpenAI communication flows through Spring AI backend
 */

// Type definitions for chatbot service
interface AuthData {
  token: string;
  tokenType: string;
}

interface AuthStatus {
  hasToken: boolean;
  tokenType?: string;
  tokenLength?: number;
  tokenPreview?: string | null;
  storage: 'memory';
}

// TokenCallback is now imported from sseUtils

/**
 * Reads the in-memory bearer session shared with the axios transport.
 * @returns Object with token and tokenType, or null if not available
 */
function getAuthToken(): AuthData | null {
  const session = getBearerSession();
  if (!session) {
    return null;
  }

  return { token: session.accessToken, tokenType: session.tokenType || 'Bearer' };
}


// SSE processing is now handled by enhanced utilities in sseUtils.ts

// Core function to call the backend streaming API using fetch for streaming support
async function streamApiCall(endpoint: string, prompt: string, onTokenReceived?: TokenCallback): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'text/plain', // Send prompt as plain text
    'Accept': 'text/event-stream', // Expect SSE response from Spring WebFlux
    'Cache-Control': 'no-cache', // Prevent caching of SSE streams
  };

  // Add authentication token with improved validation
  const authData = getAuthToken();
  if (authData) {
    headers['Authorization'] = `${authData.tokenType} ${authData.token}`;
    console.log(`Making authenticated request to ${endpoint} with token type: ${authData.tokenType}`);
  } else {
    console.warn(`No valid authentication token available for ${endpoint}`);
    // For endpoints that require authentication, this will result in a 401 error
    // which is handled below
  }

  // Use the same base URL pattern as other services
  const baseURL = config.api.baseUrl;
  const fullUrl = `${baseURL}/api/genai/chatbot${endpoint}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: headers,
      body: prompt,
      credentials: 'include', // Include cookies for session management
    });

    if (!response.ok) {
      let errorMessage = `API call failed with status ${response.status}`;
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
      } catch (e) {
        // Ignore if can't read text
      }

      console.error(`Chatbot API Error for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        url: fullUrl,
        hasAuthToken: !!authData,
        tokenType: authData?.tokenType
      });

      // Handle authentication errors following established pattern
      if (response.status === 401) {
        let sessionEnded = authData !== null;
        if (sessionEnded) {
          // The bearer may simply have expired: attempt one shared,
          // cookie-backed refresh before giving up on the session.
          try {
            await refreshSession();
            sessionEnded = false;
          } catch (_) {
            sessionEnded = true;
          }
        }

        if (sessionEnded) {
          console.error('Authentication failed - clearing the in-memory session');
          clearBearerSession();
          clearXsrfToken();
          broadcastSessionEnded();
        }

        // Provide a specific error message based on context
        const authErrorMessage = sessionEnded
          ? 'Your session has expired. Please log in again.'
          : authData
          ? 'Your session was refreshed. Please send your message again.'
          : 'Authentication required. Please log in to access this feature.';

        // Dispatch error event following established pattern
        const event = new CustomEvent('show-snackbar', {
          detail: {
            message: authErrorMessage,
            severity: 'error',
          },
        });
        window.dispatchEvent(event);

        // Only a user who actually had a session is sent back to login, after
        // a short delay to allow the message to be seen. Anonymous visitors
        // stay on the current page.
        if (sessionEnded) {
          setTimeout(() => {
            redirectToLogin();
          }, 2000);
        }
      }

      // Pass error to callback
      if (typeof onTokenReceived === 'function') {
        onTokenReceived(errorMessage, errorMessage);
      }
      throw new Error(errorMessage);
    }

    // Use enhanced SSE reader with OpenAI SDK utilities
    const cumulativeResponse = await createEnhancedSSEReader(response, onTokenReceived);
    return cumulativeResponse;
  } catch (error) {
    console.error('Error in streamApiCall:', error);

    // Use enhanced error formatting
    let userMessage = formatSSEError(error, endpoint);
    const errorMessage = (error as Error).message;

    // Handle specific backend error messages
    if (errorMessage && errorMessage.includes("maximal inquiries")) {
      userMessage = errorMessage; // Use specific rate limit message
    } else if (errorMessage && errorMessage.includes("SSE streaming failed")) {
      userMessage = 'Sorry, I encountered a connection error. Please try again.';
    } else if (!userMessage.includes('SSE streaming failed')) {
      userMessage = 'Sorry, I encountered an error processing your request. Please try again.';
    }

    // Dispatch error event following established pattern
    const event = new CustomEvent('show-snackbar', {
      detail: {
        message: userMessage,
        severity: 'error',
      },
    });
    window.dispatchEvent(event);

    // Pass error to callback
    if (typeof onTokenReceived === 'function') {
      onTokenReceived(userMessage, userMessage);
    }

    throw error; // Re-throw for caller handling
  }
}

/**
 * Enhanced Chatbot API with backend-only OpenAI integration
 *
 * All OpenAI communication flows through the Spring AI backend.
 * Frontend uses enhanced SSE processing with OpenAI SDK utilities for better data handling.
 * User identification is handled through JWT authentication tokens.
 */
const chatbotAPI = {
  /**
   * General help chatbot - no authentication required
   * @param userInput - The user's message
   * @param onTokenReceived - Callback for streaming tokens (token, fullResponse) => void
   * @returns Complete response text
   */
  async help(userInput: string, onTokenReceived?: TokenCallback): Promise<string> {
    const response = await streamApiCall('/help', userInput, onTokenReceived);
    return response;
  },

  /**
   * AI Dentist chatbot - requires authentication
   * @param userInput - The user's message
   * @param onTokenReceived - Callback for streaming tokens (token, fullResponse) => void
   * @returns Complete response text
   */
  async aidentist(userInput: string, onTokenReceived?: TokenCallback): Promise<string> {
    const authData = getAuthToken();
    if (!authData) {
      const authErrorMsg = 'Authentication required to access the AI Dentist. Please log in.';
      console.error(authErrorMsg);

      // Dispatch error event for consistency
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: authErrorMsg,
          severity: 'error',
        },
      });
      window.dispatchEvent(event);

      if (typeof onTokenReceived === 'function') {
        onTokenReceived(authErrorMsg, authErrorMsg);
      }
      return Promise.reject(new Error(authErrorMsg));
    }
    const response = await streamApiCall('/aidentist', userInput, onTokenReceived);
    return response;
  },

  /**
   * Triage chatbot - requires authentication
   * @param userInput - The user's message
   * @param onTokenReceived - Callback for streaming tokens (token, fullResponse) => void
   * @returns Complete response text
   */
  async triage(userInput: string, onTokenReceived?: TokenCallback): Promise<string> {
    // Check authentication first
    const authData = getAuthToken();
    if (!authData) {
      const authErrorMsg = 'Authentication required to access the Triage chatbot. Please log in.';
      console.error(authErrorMsg);

      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: authErrorMsg,
          severity: 'error',
        },
      });
      window.dispatchEvent(event);

      if (typeof onTokenReceived === 'function') {
        onTokenReceived(authErrorMsg, authErrorMsg);
      }
      return Promise.reject(new Error(authErrorMsg));
    }

    const response = await streamApiCall('/triage', userInput, onTokenReceived);
    return response;
  },

  /**
   * Receptionist chatbot - requires authentication
   * @param userInput - The user's message
   * @param onTokenReceived - Callback for streaming tokens (token, fullResponse) => void
   * @returns Complete response text
   */
  async receptionist(userInput: string, onTokenReceived?: TokenCallback): Promise<string> {
    // Check authentication first
    const authData = getAuthToken();
    if (!authData) {
      const authErrorMsg = 'Authentication required to access the Receptionist chatbot. Please log in.';
      console.error(authErrorMsg);

      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: authErrorMsg,
          severity: 'error',
        },
      });
      window.dispatchEvent(event);

      if (typeof onTokenReceived === 'function') {
        onTokenReceived(authErrorMsg, authErrorMsg);
      }
      return Promise.reject(new Error(authErrorMsg));
    }

    const response = await streamApiCall('/receptionist', userInput, onTokenReceived);
    return response;
  },

  /**
   * Documentation summarization chatbot - requires authentication
   * @param userInput - The user's message
   * @param onTokenReceived - Callback for streaming tokens (token, fullResponse) => void
   * @returns Complete response text
   */
  async documentationSummarize(userInput: string, onTokenReceived?: TokenCallback): Promise<string> {
    // Check authentication first
    const authData = getAuthToken();
    if (!authData) {
      const authErrorMsg = 'Authentication required to access Documentation Summarization. Please log in.';
      console.error(authErrorMsg);

      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: authErrorMsg,
          severity: 'error',
        },
      });
      window.dispatchEvent(event);

      if (typeof onTokenReceived === 'function') {
        onTokenReceived(authErrorMsg, authErrorMsg);
      }
      return Promise.reject(new Error(authErrorMsg));
    }

    const response = await streamApiCall('/documentation/summarize', userInput, onTokenReceived);
    return response;
  },

  // Legacy function names for backward compatibility
  botAssistant(userInput: string, onTokenReceived?: TokenCallback): Promise<string> {
    return this.help(userInput, onTokenReceived);
  },

  botDentist(userInput: string, onTokenReceived?: TokenCallback): Promise<string> {
    return this.aidentist(userInput, onTokenReceived);
  },

  // Additional utility methods
  isBackendIntegrationEnabled(): boolean {
    // Always true since we use backend-only OpenAI integration
    return true;
  },

  /**
   * Debug utility to check authentication status
   * @returns Authentication status information
   */
  getAuthStatus(): AuthStatus {
    const authData = getAuthToken();
    return {
      hasToken: !!authData,
      tokenType: authData?.tokenType,
      tokenLength: authData?.token?.length,
      // Don't log the actual token for security
      tokenPreview: authData?.token ? `${authData.token.substring(0, 10)}...` : null,
      storage: 'memory',
    };
  }
};

export default chatbotAPI;
