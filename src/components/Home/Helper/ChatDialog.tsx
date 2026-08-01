import React, { useRef, useEffect, memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  useTheme,
  useMediaQuery,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import type { ChatMessage, ChatState } from '../../../hooks/useChatState';

/**
 * Chat Dialog Props Interface
 */
interface ChatDialogProps {
  readonly isOpen: boolean;
  readonly messages: readonly ChatMessage[];
  readonly chatState: ChatState;
  readonly inputValue: string;
  readonly onClose: () => void;
  readonly onInputChange: (value: string) => void;
  readonly onSubmit: (message: string) => void;
  readonly onClearError: () => void;
}

/**
 * Message Item Component
 * Memoized for performance optimization
 */
const MessageItem = memo<{ message: ChatMessage; isDarkMode: boolean }>(({ message, isDarkMode }) => {
  const theme = useTheme();

  const getMessageStyles = () => {
    if (message.error) {
      return {
        bgcolor: isDarkMode ? '#d32f2f' : '#ffebee',
        color: isDarkMode ? '#fff' : '#d32f2f',
        border: `1px solid ${isDarkMode ? '#f44336' : '#f44336'}`,
      };
    }

    if (message.sender === 'user') {
      return {
        bgcolor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
      };
    }

    return {
      bgcolor: isDarkMode ? theme.palette.grey[700] : theme.palette.grey[200],
      color: theme.palette.text.primary,
    };
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        maxWidth: '80%',
        alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
        ...getMessageStyles(),
        boxShadow: isDarkMode ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
        position: 'relative',
      }}
    >
      <Typography variant="body2" sx={{ color: 'inherit' }}>
        {message.text || (message.isStreaming ? 'Thinking...' : '')}
      </Typography>
      
      {message.isStreaming && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <CircularProgress size={12} sx={{ mr: 1 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Typing...
          </Typography>
        </Box>
      )}
    </Box>
  );
});

MessageItem.displayName = 'MessageItem';

/**
 * Welcome Message Component
 */
const WelcomeMessage = memo(() => (
  <Typography
    variant="body2"
    sx={{
      textAlign: 'center',
      mt: 10,
      color: 'text.secondary',
    }}
  >
    Hi there! How can I help you today?
  </Typography>
));

WelcomeMessage.displayName = 'WelcomeMessage';

/**
 * Chat Input Form Component
 */
const ChatInputForm = memo<{
  inputValue: string;
  isLoading: boolean;
  isDarkMode: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => void;
}>(({ inputValue, isLoading, isDarkMode, onInputChange, onSubmit }) => {
  const theme = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 1,
        display: 'flex',
        borderTop: `1px solid ${theme.palette.divider}`,
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder={isLoading ? "Processing..." : "Type your message..."}
        variant="outlined"
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isLoading}
        onKeyDown={handleKeyDown}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-disabled': {
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            },
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isLoading || !inputValue.trim()}
        sx={{
          minWidth: 'auto',
          px: 2,
          '&.Mui-disabled': {
            bgcolor: isDarkMode ? '#424242' : '#e0e0e0',
          },
        }}
        aria-label="send message"
      >
        {isLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <SendIcon fontSize="small" />
        )}
      </Button>
    </Box>
  );
});

ChatInputForm.displayName = 'ChatInputForm';

/**
 * Chat Dialog Component
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only handles chat dialog UI
 * - Open/Closed: Extensible through props interface
 * - Liskov Substitution: Can be replaced with different dialog implementations
 * - Interface Segregation: Focused interface for dialog operations
 * - Dependency Inversion: Depends on abstractions through props
 */
export const ChatDialog: React.FC<ChatDialogProps> = ({
  isOpen,
  messages,
  chatState,
  inputValue,
  onClose,
  onInputChange,
  onSubmit,
  onClearError,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) {
    return null;
  }

  return (
    <Paper
      elevation={isDarkMode ? 6 : 3}
      role="dialog"
      aria-label="Dentabot"
      sx={{
        position: 'absolute',
        bottom: { xs: 60, sm: 70 },
        right: 0,
        width: { xs: 280, sm: 300, md: 320 },
        height: { xs: 350, sm: 400 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: isDarkMode ? '#1c1c21' : 'background.paper',
        border: isDarkMode ? '1px solid #2e2e35' : '1px solid #e5e5ea',
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          Dentabot
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'primary.contrastText' }}
          aria-label="close chat"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Error Alert */}
      {chatState.hasError && chatState.error && (
        <Alert 
          severity="error" 
          onClose={onClearError}
          sx={{ m: 1, fontSize: '0.875rem' }}
        >
          {chatState.error}
        </Alert>
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'background.paper',
        }}
      >
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            isDarkMode={isDarkMode} 
          />
        ))}
        
        {messages.length === 0 && !chatState.isLoading && <WelcomeMessage />}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Form */}
      <ChatInputForm
        inputValue={inputValue}
        isLoading={chatState.isLoading}
        isDarkMode={isDarkMode}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </Paper>
  );
};

export default ChatDialog;
