import React from 'react';
import { Box, Typography, Paper, IconButton, Avatar, Fade } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

interface Message {
  role: 'user' | 'assistant' | 'Professional Dentist';
  content: string;
  thinking?: string | null;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  showThinking?: boolean;
  onToggleThinking?: () => void;
  isThinkingClosing?: boolean;
  isMobile?: boolean;
  animationDots?: string;
}

/**
 * MessageBubble - Chat message bubble component
 * 
 * Features:
 * - User and AI message differentiation
 * - Thinking process visualization with toggle
 * - Markdown content rendering
 * - Streaming indicators with animation
 * - Mobile-responsive design
 * - Avatar icons for message types
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showThinking = false,
  onToggleThinking,
  isThinkingClosing = false,
  isMobile = false,
  animationDots = ''
}) => {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: isMobile ? 1.5 : 2,
        position: 'relative',
        px: isMobile ? 0.5 : 0,
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            mr: 1,
            width: isMobile ? 28 : 36,
            height: isMobile ? 28 : 36
          }}
        >
          <SmartToyIcon fontSize={isMobile ? "inherit" : "small"} />
        </Avatar>
      )}

      <Paper
        elevation={1}
        sx={{
          p: isMobile ? 1.5 : 2,
          maxWidth: isMobile ? '85%' : '75%',
          bgcolor: isUser ? 'primary.light' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: isMobile ? 1.5 : 2,
          wordBreak: 'break-word',
        }}
      >
        {message.thinking && onToggleThinking && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton
                size={isMobile ? "small" : "medium"}
                onClick={onToggleThinking}
                sx={{ mr: 1, p: isMobile ? 0.5 : 1 }}
              >
                <PsychologyIcon 
                  fontSize={isMobile ? "small" : "medium"}
                  color={showThinking ? "primary" : "action"} 
                />
              </IconButton>
              <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: 'bold' }}>
                {showThinking ? "Hide Thinking" : "Show Thinking"}
              </Typography>
            </Box>

            {showThinking && (
              <Fade in={!isThinkingClosing} timeout={1000}>
                <Box
                  sx={{
                    p: isMobile ? 1 : 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    fontFamily: 'monospace',
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto'
                  }}
                >
                  <Box sx={{ display: 'inline' }}>
                    {message.thinking.replace(/^<think>/, '')}
                    {message.isStreaming && (
                      <span className="typing-indicator" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </span>
                    )}
                  </Box>
                </Box>
              </Fade>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <Box sx={{ flexGrow: 1 }}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
          {message.isStreaming && animationDots && (
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 1, 
                color: 'text.secondary',
                fontFamily: 'monospace',
                minWidth: '20px'
              }}
            >
              {animationDots}
            </Typography>
          )}
        </Box>
      </Paper>

      {isUser && (
        <Avatar
          sx={{
            bgcolor: 'action.selected',
            color: 'text.primary',
            ml: 1,
            width: isMobile ? 28 : 36,
            height: isMobile ? 28 : 36
          }}
        >
          <PersonIcon fontSize={isMobile ? "inherit" : "small"} />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;
