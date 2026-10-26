import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

/**
 * CommunicationsPage - Communications tools page for receptionists
 * 
 * Features:
 * - Appointment reminders
 * - SMS notifications
 * - Communication tools
 */
const CommunicationsPage: React.FC = () => {
  return (
    <Box sx={{ pt: 2, height: '100%' }}>
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Communication tools
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Appointment reminders"
                secondary="Send automated reminders to patients"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="SMS Notifications"
                secondary="Log and manage text message notifications sent to patients"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CommunicationsPage;
