import React from 'react';
import {
  Box,
  Button,
  Paper,
  Alert,
  List,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { MedicalServices as DentistIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import useAIChat from '../../../hooks/useAIChat';
import ChatMessage from '../../../components/shared/ChatComponents/ChatMessage';
import ChatInput from '../../../components/shared/ChatComponents/ChatInput';
import { getWelcomeMessage, getQuickActions } from '../../../utils/chatUtils';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
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
    <>
      <PageHeader
        title="Clinical assistant"
        description="Ask about symptoms, treatment options and clinical guidelines. Check its answers against your own clinical judgement."
        actions={<Button variant="outlined" onClick={() => clearConversation()}>New conversation</Button>}
      />

      <Paper
        variant="outlined"
        sx={{
          height: { xs: '62dvh', md: '70vh' },
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
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
    </>
  );
};

export default AIDentistPage;
