import React, { useCallback } from 'react';
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
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import useAIChat from '../../../hooks/useAIChat';
import ChatMessage from '../../../components/shared/ChatComponents/ChatMessage';
import ChatInput from '../../../components/shared/ChatComponents/ChatInput';
import { getWelcomeMessage, getQuickActions } from '../../../utils/chatUtils';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import dayjs from '../../../utils/dayjs';

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

  // The newest AI reply after the welcome message, however it was sent
  const lastSummary = messages.slice(1).reverse().find((message) => message.type === 'ai')?.content ?? '';

  // Copy the summary so the dentist can paste it into the patient's record.
  // Saving it to a record directly needs the appointment it belongs to, which
  // this page doesn't know.
  const handleCopySummary = useCallback(async () => {
    if (!lastSummary) return;

    let copied = true;
    try {
      await navigator.clipboard.writeText(lastSummary);
    } catch {
      copied = false;
    }

    window.dispatchEvent(new CustomEvent('show-snackbar', {
      detail: copied
        ? { message: 'Summary copied', severity: 'success' }
        : { message: "Couldn't copy the summary. Select the text and copy it instead.", severity: 'error' },
    }));
  }, [lastSummary]);

  // Download summary
  const handleDownloadSummary = useCallback(() => {
    if (!lastSummary) return;
    
    const blob = new Blob([lastSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-summary-${dayjs().format('YYYY-MM-DD')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [lastSummary]);

  return (
    <>
      <PageHeader
        title="Note summaries"
        description="Paste appointment or clinical notes to get a structured summary. Read it through before you use it."
        actions={<Button variant="outlined" onClick={() => clearConversation()}>New conversation</Button>}
      />

      <Paper
        variant="outlined"
        sx={{ height: { xs: '62dvh', md: '70vh' }, minHeight: 420, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}
      >
        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <List sx={{ width: '100%' }}>
            {messages.map((message, index) => {
              // Replies after the welcome message are summaries
              if (index > 0 && message.type === 'ai' && message.content) {
                return (
                  <Box key={message.id} sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                    <Card variant="outlined" sx={{ maxWidth: { xs: '100%', md: '80%' } }}>
                      <CardContent>
                        <Typography variant="subtitle1" component="h2" gutterBottom sx={{ fontWeight: 650, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DocumentIcon fontSize="small" color="primary" />
                          Summary
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                          {message.isStreaming && (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
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
                          <Button size="small" startIcon={<CopyIcon />} onClick={handleCopySummary}>
                            Copy summary
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
          onSend={sendMessage}
          onKeyPress={handleKeyPress}
          placeholder="Paste appointment notes, clinical observations, or treatment details for summarization…"
          isLoading={isLoading}
          quickActions={quickActions}
          maxRows={6}
        />
      </Paper>
    </>
  );
};

export default AISummarizePage;
