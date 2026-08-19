import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  List,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  LocalHospital as TriageIcon,
  SupportAgent as ReceptionistIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import useAIChat from '../../../hooks/useAIChat';
import ChatHeader from '../../../components/shared/ChatComponents/ChatHeader';
import ChatMessage from '../../../components/shared/ChatComponents/ChatMessage';
import ChatInput from '../../../components/shared/ChatComponents/ChatInput';
import { getWelcomeMessage, getQuickActions } from '../../../utils/chatUtils';
import {
  getResponsivePadding,
  getResponsiveMargin,
  TOUCH_TARGETS
} from '../../../utils/mobileOptimization';

type ChatType = 'receptionist' | 'triage';

/**
 * AIReceptionistPage - AI chat interface for patients
 *
 * Features:
 * - Default receptionist mode using the shared chatbot transport
 * - Activatable "AI Triage" tab using the selected chat agent
 * - Real-time SSE streaming responses
 * - Session management for conversation continuity
 * - Material-UI consistent design
 * - Responsive design with mobile optimization
 */
const AIReceptionistPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Receptionist, 1: Triage

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get current chat type and welcome message
  const currentChatType: ChatType = activeTab === 0 ? 'receptionist' : 'triage';
  const welcomeMessage = getWelcomeMessage(currentChatType, 'PATIENT', currentUser);

  // Use AI chat hook
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
  } = useAIChat(currentChatType, welcomeMessage);

  // Handle tab change
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Clear conversation with new welcome message
    const newChatType: ChatType = newValue === 0 ? 'receptionist' : 'triage';
    const newWelcomeMessage = getWelcomeMessage(newChatType, 'PATIENT', currentUser);
    clearConversation(newWelcomeMessage);
  }, [clearConversation, currentUser]);

  // Handle message sending for the selected chat agent.
  const handleSendMessage = useCallback(async () => {
    await sendMessage();
  }, [sendMessage]);

  // Get quick actions for current mode
  const quickActions = getQuickActions(currentChatType, setQuickInput);

  return (
    <Box sx={{
      p: getResponsivePadding('medium'),
      maxWidth: { xs: '100%', sm: '100%', md: 1000 },
      mx: 'auto',
      height: '100%'
    }}>
      <Paper
        elevation={2}
        sx={{
          minHeight: { xs: 'calc(100vh - 160px)', sm: 'calc(100vh - 140px)', md: '78vh' },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: 1, sm: 2 },
          overflow: 'hidden'
        }}
      >
        {/* Tab Header */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="AI assistant modes"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 64 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }
              }
            }}
          >
            <Tab
              icon={<ReceptionistIcon />}
              label={isMobile ? "Reception" : "Receptionist"}
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab
              icon={<TriageIcon />}
              label={isMobile ? "Triage" : "AI Triage"}
              iconPosition={isMobile ? "top" : "start"}
            />
          </Tabs>

          <ChatHeader
            icon={activeTab === 0 ? <ReceptionistIcon color="primary" /> : <TriageIcon color="primary" />}
            title={activeTab === 0 ?
              (isMobile ? "Reception" : "Receptionist Mode") :
              (isMobile ? "Triage" : "Triage Mode")
            }
            subtitle={activeTab === 0 ?
              (isMobile ?
                "Appointments & services" :
                "Ask about appointments, clinic services, or general information"
              ) :
              (isMobile ?
                "Describe your symptoms" :
                "Describe your symptoms or dental concerns for assessment"
              )
            }
            onClear={clearConversation}
            showClearButton
            isMobile={isMobile}
          />
        </Box>

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
                aiAvatar={activeTab === 0 ? <ReceptionistIcon /> : <TriageIcon />}
                currentUser={currentUser}
                isMobile={isMobile}
              />
            ))}
          </List>
        </Box>

        <ChatInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          placeholder={activeTab === 0 ?
            (isMobile ?
              "Ask about appointments..." :
              "Ask about appointments, clinic services, or general information..."
            ) :
            (isMobile ?
              "Describe symptoms..." :
              "Describe your symptoms or dental concerns..."
            )
          }
          isLoading={isLoading}
          quickActions={quickActions}
          isMobile={isMobile}
        />
      </Paper>
    </Box>
  );
};

export default AIReceptionistPage;
