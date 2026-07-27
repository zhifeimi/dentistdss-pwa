import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Grid,
  ListItemIcon
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import DraftsIcon from '@mui/icons-material/Drafts'; // For read messages
import api from '../services';

interface Message {
  id: number;
  subject: string;
  sender: string;
  date: string;
  content: string;
  read: boolean;
}

interface MessagePanelProps {
  userId: number;
}

const MessagePanel: React.FC<MessagePanelProps> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [sortBy] = useState<string>('date_desc'); // 'date_asc', 'read_status' - TODO: Add sorting UI
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setLoading(true);
    setError('');
    api.message.getMessages(userId)
      .then((messages) => {
        // Ensure messages have required properties
        const formattedMessages = messages.map(msg => ({
          ...msg,
          date: msg.date || msg.createdAt || new Date().toISOString(),
          read: msg.read ?? msg.isRead ?? false,
          sender: typeof msg.sender === 'object' && msg.sender
            ? `${msg.sender.firstName} ${msg.sender.lastName}`
            : (msg.sender as string) || 'Unknown'
        }));
        setMessages(formattedMessages);
      })
      .catch((err: any) => {
        // Extract error message string from error object
        const errorMessage = err?.message || err?.response?.data?.message || 'Failed to load messages. Please try again.';
        setError(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSelectMessage = (message: Message): void => {
    setSelectedMessage(message);
    if (!message.read) {
      // Mark as read locally and then call API
      setMessages(prevMessages =>
          prevMessages.map(m => m.id === message.id ? {...m, read: true} : m)
      );
      // TODO: API call to mark message as read
      console.log(`Marking message ${message.id} as read`);
    }
  };

  const sortedMessages = [...messages].sort((a: Message, b: Message) => {
    if (sortBy === 'read_status') {
      return a.read === b.read ? 0 : a.read ? 1 : -1; // Unread first
    }
    // Default to date descending
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (loading) {
    return <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}><CircularProgress/></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{m: 2}}>{error}</Alert>;
  }

  return (
      <Box sx={{p: isMobile ? 1 : 2, minHeight: '78vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}}>
        {messages.length === 0 ? (
            <Typography sx={{textAlign: 'center', p: 2}}>You have no messages.</Typography>
        ) : (
            <Grid container spacing={isMobile ? 1 : 2} sx={{flexGrow: 1, overflow: 'hidden'}}>
              <Grid size={{ xs: 12, md: 4 }} sx={{
                overflowY: 'auto',
                height: isMobile ? '200px' : 'auto',
                borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
                p: 1
              }}>
                <List component="nav" aria-label="message list">
                  {sortedMessages.map((msg) => (
                      <React.Fragment key={msg.id}>
                        <ListItem
                            component="button"
                            onClick={() => handleSelectMessage(msg)}
                            sx={{
                              bgcolor: selectedMessage?.id === msg.id ? theme.palette.action.selected : 'inherit',
                              borderRadius: 1,
                              mb: 0.5,
                              cursor: 'pointer',
                              border: 'none',
                              width: '100%',
                              textAlign: 'left'
                            }}
                        >
                          <ListItemIcon sx={{minWidth: 'auto', mr: 1.5}}>
                            {msg.read ? <DraftsIcon color="disabled"/> : <MailIcon color="primary"/>}
                          </ListItemIcon>
                          <ListItemText
                              primary={msg.subject}
                              secondary={`From: ${msg.sender} - ${new Date(msg.date).toLocaleDateString()}`}
                              slotProps={{
                                primary: {sx: {fontWeight: msg.read ? 'normal' : 'bold'}, noWrap: true},
                                secondary: {noWrap: true}
                              }}
                          />
                          {!msg.read && <Chip label="New" color="primary" size="small" sx={{ml: 1}}/>}
                        </ListItem>
                        <Divider component="li"/>
                      </React.Fragment>
                  ))}
                </List>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}
                    sx={{overflowY: 'auto', height: isMobile ? 'calc(100% - 200px)' : 'auto', p: isMobile ? 1 : 2}}>
                {selectedMessage ? (
                    <Box>
                      <Typography variant="h6" gutterBottom>{selectedMessage.subject}</Typography>
                      <Typography variant="caption" color="textSecondary" sx={{display: 'block'}} gutterBottom>
                        From: {selectedMessage.sender} | Received: {new Date(selectedMessage.date).toLocaleString()}
                      </Typography>
                      <Divider sx={{my: 2}}/>
                      <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>{selectedMessage.content}</Typography>
                    </Box>
                ) : (
                    <Typography sx={{textAlign: 'center', color: 'text.secondary', mt: isMobile ? 2 : 4}}>
                      Select a message to read its content.
                    </Typography>
                )}
              </Grid>
            </Grid>
        )}
      </Box>
  );
};

export default MessagePanel;
