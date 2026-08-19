import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  List,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  MedicalServices as DentistIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import useAIChat from '../../../hooks/useAIChat';
import ChatHeader from '../../../components/shared/ChatComponents/ChatHeader';
import ChatMessage from '../../../components/shared/ChatComponents/ChatMessage';
import ChatInput from '../../../components/shared/ChatComponents/ChatInput';
import { getWelcomeMessage, getQuickActions } from '../../../utils/chatUtils';
import {
  getResponsivePadding,
  getResponsiveMargin
} from '../../../utils/mobileOptimization';

/**
 * AIDentistPage - AI clinical assistant for dentists
 *
 * Features:
 * - Uses the shared chatbot transport for dental consultation
 * - Real-time SSE streaming responses
 * - Session management for conversation continuity
 * - Clinical decision support interface
 * - Material-UI consistent design
 * - Responsive design with mobile optimization
 */
const AIDentistPage: React.FC = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get welcome message and use AI chat hook
  const welcomeMessage = getWelcomeMessage('aidentist', 'DENTIST', currentUser);
  const {
    messages,
    inputValue,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    handleKeyPress,
    setQuickInput,
    setInputValue,
  } = useAIChat('aidentist', welcomeMessage);

  // Get quick actions
  const quickActions = getQuickActions('aidentist', setQuickInput);

  return (
    <Box sx={{
      p: getResponsivePadding('medium'),
      maxWidth: { xs: '100%', sm: '100%', md: 1200 },
      mx: 'auto',
      height: '100%'
    }}>
      <Typography
        variant={isMobile ? "h5" : "h4"}
        gutterBottom
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          fontWeight: 600,
          mb: getResponsiveMargin('medium'),
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        <SmartToyIcon
          color="primary"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
        />
        {isMobile ? 'AI Assistant' : 'AI Clinical Assistant'}
      </Typography>

      <Paper
        elevation={2}
        sx={{
          height: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 180px)', md: '70vh' },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: 1, sm: 2 },
          overflow: 'hidden'
        }}
      >
        <ChatHeader
          icon={<DentistIcon color="primary" />}
          title={isMobile ? "AI Dentist" : "AI Dentist - Clinical Decision Support"}
          subtitle={isMobile ?
            "Clinical support & guidance" :
            "Ask about patient symptoms, treatment options, clinical guidelines, or diagnostic support"
          }
          onClear={clearConversation}
          isMobile={isMobile}
        />

        {/* Messages Area */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          p: getResponsivePadding('small'),
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '8px' }
          }
        }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: getResponsiveMargin('small'),
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                '& .MuiAlert-message': {
                  fontSize: 'inherit'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <List sx={{
            width: '100%',
            '& .MuiListItem-root': {
              px: { xs: 0, sm: 1 }
            }
          }}>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                userAvatar={`Dr. ${currentUser?.lastName?.charAt(0) || 'D'}`}
                aiAvatar={<DentistIcon />}
                currentUser={currentUser}
                isMobile={isMobile}
              />
            ))}
          </List>
        </Box>

        <ChatInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSend={sendMessage}
          onKeyPress={handleKeyPress}
          placeholder={isMobile ?
            "Ask about symptoms, treatments..." :
            "Ask about patient symptoms, treatment options, clinical guidelines..."
          }
          isLoading={isLoading}
          quickActions={quickActions}
          isMobile={isMobile}
        />
      </Paper>
    </Box>
  );
};

export default AIDentistPage;
