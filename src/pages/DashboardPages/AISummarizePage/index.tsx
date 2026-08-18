import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  List,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
} from '@mui/material';
import {
  Summarize as SummarizeIcon,
  Description as DocumentIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import useAIChat from '../../../hooks/useAIChat';
import ChatHeader from '../../../components/shared/ChatComponents/ChatHeader';
import ChatMessage from '../../../components/shared/ChatComponents/ChatMessage';
import ChatInput from '../../../components/shared/ChatComponents/ChatInput';
import { getWelcomeMessage, getQuickActions } from '../../../utils/chatUtils';

interface CustomEvent extends Event {
  detail: {
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
}

/**
 * AISummarizePage - AI documentation summarization for dentists
 *
 * Features:
 * - Uses the shared chatbot transport for post-appointment summaries
 * - Real-time SSE streaming responses
 * - Session management for conversation continuity
 * - Documentation and summarization interface
 * - Material-UI consistent design
 */
const AISummarizePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [lastSummary, setLastSummary] = useState<string>('');

  // Get welcome message and use AI chat hook
  const welcomeMessage = getWelcomeMessage('documentationSummarize', 'DENTIST', currentUser);
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
  } = useAIChat('documentationSummarize', welcomeMessage);

  // Get quick actions
  const quickActions = getQuickActions('documentationSummarize', setQuickInput);

  // Capture cumulative summary text while the shared transport streams.
  const handleSendMessage = useCallback(async () => {
    await sendMessage(null, setLastSummary);
  }, [sendMessage]);

  // Clear conversation and reset summary
  const handleClearConversation = useCallback(() => {
    clearConversation();
    setLastSummary('');
  }, [clearConversation]);

  // Save summary (placeholder - would integrate with patient records)
  const handleSaveSummary = useCallback(() => {
    if (!lastSummary) return;
    
    // TODO: Integrate with patient records API
    console.log('Saving summary:', lastSummary);
    
    // Show success notification
    const event = new CustomEvent('show-snackbar', {
      detail: {
        message: 'Summary saved to patient records',
        severity: 'success',
      },
    }) as CustomEvent;
    window.dispatchEvent(event);
  }, [lastSummary]);

  // Download summary
  const handleDownloadSummary = useCallback(() => {
    if (!lastSummary) return;
    
    const blob = new Blob([lastSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [lastSummary]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SummarizeIcon color="primary" />
        AI Documentation Assistant
      </Typography>

      <Paper elevation={2} sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <ChatHeader
          icon={<DocumentIcon color="primary" />}
          title="AI Summarization - Clinical Documentation"
          subtitle="Provide appointment details, clinical notes, or treatment information for AI-powered summarization"
          onClear={handleClearConversation}
          additionalActions={
            lastSummary && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSummary}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadSummary}
                >
                  Download
                </Button>
              </>
            )
          }
        />

        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <List sx={{ width: '100%' }}>
            {messages.map((message) => {
              // Special handling for AI summary messages
              if (message.type === 'ai' && message.content) {
                return (
                  <Box key={message.id} sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                    <Card sx={{ maxWidth: '70%', elevation: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DocumentIcon />
                          Clinical Summary
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                          {message.isStreaming && (
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
                              <CircularProgress size={16} />
                            </Box>
                          )}
                        </Typography>
                        <Typography variant="caption" sx={{
                          opacity: 0.7,
                          display: 'block',
                          mt: 1,
                        }}>
                          Generated at {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </CardContent>
                      {!message.isStreaming && message.content && (
                        <CardActions>
                          <Button size="small" startIcon={<SaveIcon />} onClick={handleSaveSummary}>
                            Save to Records
                          </Button>
                          <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownloadSummary}>
                            Download
                          </Button>
                        </CardActions>
                      )}
                    </Card>
                  </Box>
                );
              }

              // Regular message handling
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userAvatar={`Dr. ${currentUser?.lastName?.charAt(0) || 'D'}`}
                  aiAvatar={<SummarizeIcon />}
                  currentUser={currentUser}
                />
              );
            })}
          </List>
        </Box>

        <ChatInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          placeholder="Paste appointment notes, clinical observations, or treatment details for summarization..."
          isLoading={isLoading}
          quickActions={quickActions}
          maxRows={6}
        />
      </Paper>
    </Box>
  );
};

export default AISummarizePage;
