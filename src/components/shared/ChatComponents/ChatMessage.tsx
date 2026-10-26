import React, { ReactNode } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  ListItem,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';

interface ChatMessage {
  id: string | number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface CurrentUser {
  firstName?: string;
  [key: string]: any;
}

interface ChatMessageProps {
  message: ChatMessage;
  userAvatar?: ReactNode;
  aiAvatar: ReactNode;
  currentUser?: CurrentUser | null;
  isStreaming?: boolean;
  isMobile?: boolean;
}

/**
 * Reusable chat message component
 */
const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  userAvatar,
  aiAvatar,
  currentUser,
  isStreaming = false
}) => {
  const isUser = message.type === 'user';
  
  return (
    <ListItem
      sx={{
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 1,
      }}
    >
      <ListItemAvatar sx={{ 
        minWidth: 48,
        ml: isUser ? 1 : 0,
        mr: isUser ? 0 : 1,
      }}>
        <Avatar sx={{ 
          bgcolor: isUser ? 'action.selected' : 'primary.main',
          color: isUser ? 'text.primary' : 'primary.contrastText',
          width: 32,
          height: 32,
        }}>
          {isUser ? 
            (userAvatar || currentUser?.firstName?.charAt(0) || 'U') : 
            aiAvatar
          }
        </Avatar>
      </ListItemAvatar>
      
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: isUser ? 'primary.light' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
          {(message.isStreaming || isStreaming) && (
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
              <CircularProgress size={16} />
            </Box>
          )}
        </Typography>
        <Typography variant="caption" sx={{ 
          opacity: 0.7,
          display: 'block',
          mt: 0.5,
        }}>
          {message.timestamp.toLocaleTimeString()}
        </Typography>
      </Paper>
    </ListItem>
  );
};

export default ChatMessage;
