import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Paper,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../../../services';
import { ChatTransportError } from '../../../services/chatbot';
import MessageBubble from '../../../components/MessageBubble';


interface Message {
  role: 'user' | 'assistant' | 'Professional Dentist';
  content: string;
  thinking?: string | null;
  isStreaming?: boolean;
}

const INITIAL_MESSAGE: Message = {
  role: 'Professional Dentist',
  content: "Hello! I'm your professional dentist AI. How can I help you with your dental questions today?"
};

const THINKING_ANIMATION_DURATION = 1000;
const DOTS_INTERVAL = 500;
const THINK_TAG_START = '<think>';
const THINK_TAG_END = '</think>';

/**
 * ChatInterface - Professional dentist AI chat interface
 * 
 * Features:
 * - Real-time streaming chat with AI dentist
 * - Thinking process visualization with animations
 * - Auto-scroll with user control
 * - Mobile-responsive design
 * - User identification through JWT authentication
 * - Typing indicators and loading states
 * - Multi-line input support
 */
const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [thinking, setThinking] = useState<string>('');
  const [showThinking, setShowThinking] = useState<boolean>(false);
  const [dots, setDots] = useState<string>('');
  const [isThinkingClosing, setIsThinkingClosing] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const latestTextRef = useRef('');
  const isMountedRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAtBottom]);

  const handleScroll = useCallback(() => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      // Consider the user at bottom if they're within 30px of the bottom
      const bottomThreshold = 30;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight <= bottomThreshold);
    }
  }, []);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [handleScroll]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let dotsInterval: NodeJS.Timeout;
    const isStreaming = messages[messages.length - 1]?.isStreaming;

    if (isStreaming) {
      dotsInterval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, DOTS_INTERVAL);
    } else {
      setDots('');
    }

    return () => clearInterval(dotsInterval);
  }, [messages]);

  useEffect(() => {
    if (isThinkingClosing) {
      const timer = setTimeout(() => {
        setShowThinking(false);
        setIsThinkingClosing(false);
      }, THINKING_ANIMATION_DURATION);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isThinkingClosing]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, showThinking, scrollToBottom]);

  const processThinkingContent = useCallback((
    fullText: string,
    updatedMessages: Message[],
    isFinal: boolean,
  ) => {
    const thinkMatch = fullText.match(new RegExp(`${THINK_TAG_START}(.*?)`, 's'));
    if (!thinkMatch) {
      return {
        updatedMessages: [
          ...updatedMessages.slice(0, -1),
          { role: 'assistant' as const, content: fullText, isStreaming: !isFinal }
        ],
        shouldShowThinking: false
      };
    }

    setShowThinking(true);
    const thinkingStartIndex = fullText.indexOf(THINK_TAG_START) + THINK_TAG_START.length;
    const thinkingText = fullText.substring(thinkingStartIndex);
    const thinkingEndIndex = thinkingText.indexOf(THINK_TAG_END);

    if (thinkingEndIndex === -1) {
      setThinking(thinkingText);
      return {
        updatedMessages: [
          ...updatedMessages.slice(0, -1),
          {
            role: 'assistant' as const,
            content: fullText.substring(0, fullText.indexOf(THINK_TAG_START)).trim(),
            thinking: thinkingText,
            isStreaming: !isFinal
          }
        ],
        shouldShowThinking: true
      };
    }

    const completeThinkingText = thinkingText.substring(0, thinkingEndIndex);
    const finalContent = fullText.replace(new RegExp(`${THINK_TAG_START}.*?${THINK_TAG_END}`, 's'), '').trim();
    setThinking(completeThinkingText);

    return {
      updatedMessages: [
        ...updatedMessages.slice(0, -1),
        {
          role: 'assistant' as const,
          content: finalContent,
          thinking: completeThinkingText,
          isStreaming: !isFinal
        }
      ],
      shouldShowThinking: !isFinal
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const prompt = input;
    if (!prompt.trim() || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    latestTextRef.current = '';

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '', thinking: null, isStreaming: true }]);
    setInput('');
    setThinking('');
    setShowThinking(true);
    setIsThinkingClosing(false);

    try {
      const result = await api.chatbot.send('aidentist', prompt, {
        signal: controller.signal,
        onText: (fullText: string) => {
          latestTextRef.current = fullText;
          if (!isMountedRef.current) return;
          setMessages(prevMessages => {
            const processed = processThinkingContent(fullText, prevMessages, false);
            setShowThinking(processed.shouldShowThinking);
            return processed.updatedMessages;
          });
        },
      });

      if (!isMountedRef.current) return;

      if (result.kind === 'cancelled') {
        const finalText = result.text || latestTextRef.current;
        if (!finalText) {
          setMessages(prev => prev.slice(0, -1));
          setShowThinking(false);
        } else {
          setMessages(prevMessages => {
            const processed = processThinkingContent(finalText, prevMessages, true);
            setShowThinking(processed.shouldShowThinking);
            return processed.updatedMessages;
          });
        }
      } else {
        setMessages(prevMessages => {
          const processed = processThinkingContent(result.text, prevMessages, true);
          setShowThinking(processed.shouldShowThinking);
          return processed.updatedMessages;
        });
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error calling ChatBot:', error);
      const partialText = error instanceof ChatTransportError ? error.partialText : undefined;
      const retainedText = partialText || latestTextRef.current;
      setMessages(prev => {
        if (!retainedText) {
          return [
            ...prev.slice(0, -1),
            {
              role: 'assistant',
              content: "I'm sorry, I encountered an error. Please try again later.",
              isStreaming: false
            }
          ];
        }

        const processed = processThinkingContent(retainedText, prev, true);
        return [
          ...processed.updatedMessages,
          {
            role: 'assistant',
            content: "I'm sorry, I encountered an error. Please try again later.",
            isStreaming: false
          }
        ];
      });
      setShowThinking(false);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      loadingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const toggleThinking = useCallback(() => {
    setIsThinkingClosing(showThinking);
    setShowThinking(!showThinking);
  }, [showThinking]);

  const paperStyles = useMemo(() => ({
    flexGrow: 1,
    mb: 2,
    p: isMobile ? 1 : 2,
    overflowY: 'scroll' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: isMobile ? 1 : 2
  }), [isMobile]);

  const isLastMessage = useCallback((index: number) => index === messages.length - 1, [messages.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSendMessage(e as any);
      }
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? 'calc(100vh - 120px)' : '70vh',
      maxWidth: '100%'
    }}>
      <Paper elevation={3} sx={paperStyles} ref={messageContainerRef}>
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            showThinking={(showThinking || isThinkingClosing) && isLastMessage(index) && !!message.thinking}
            onToggleThinking={toggleThinking}
            isThinkingClosing={isThinkingClosing && isLastMessage(index)}
            animationDots={isLastMessage(index) && message.isStreaming ? dots : ''}
            isMobile={isMobile}
          />
        ))}
        <div ref={messagesEndRef} />
      </Paper>

      <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={isMobile ? "Ask a dental question..." : "Ask about dental care, procedures, or concerns..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          multiline
          maxRows={isMobile ? 3 : 4}
          minRows={input.includes('\n') ? (isMobile ? 2 : 3) : 1}
          size={isMobile ? "small" : "medium"}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? '12px' : '16px',
              fontSize: isMobile ? '0.875rem' : '1rem',
            }
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="submit"
                    disabled={!input.trim() || loading}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  >
                    <SendIcon fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          onKeyDown={handleKeyDown}
        />
      </form>
    </Box>
  );
};

export default ChatInterface;
