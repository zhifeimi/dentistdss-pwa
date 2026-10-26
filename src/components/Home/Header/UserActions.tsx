import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { MailOutlined as MailIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';

interface UserActionsProps {
  isAuthenticated: boolean;
}

export const UserActions: React.FC<UserActionsProps> = ({ isAuthenticated }) => {
  if (isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Messages">
          <IconButton
            aria-label="Messages"
            component={RouterLink}
            to="/messages"
            sx={{ color: 'text.secondary' }}
          >
            <MailIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button component={RouterLink} to="/login" sx={{ color: 'text.primary' }}>
        Log in
      </Button>
      <Button component={RouterLink} to="/signup" variant="contained">
        Sign up
      </Button>
    </Box>
  );
};
