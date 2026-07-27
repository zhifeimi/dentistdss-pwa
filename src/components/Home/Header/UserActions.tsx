import React from 'react';
import { Box, Button, IconButton, Badge } from '@mui/material';
import { Mail as MailIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';
import type { User } from './types';

interface UserActionsProps {
  isAuthenticated: boolean;
  currentUser?: User | null;
}

/**
 * User action buttons (login/signup or dashboard/messages)
 * Simplified user action logic
 */
export const UserActions: React.FC<UserActionsProps> = ({ 
  isAuthenticated, 
  currentUser 
}) => {
  if (isAuthenticated) {
    return (
      <>
        <IconButton
          color="inherit"
          component={RouterLink}
          to="/dashboard/messages"
          sx={{ mr: 1.5 }}
        >
          <Badge badgeContent={3} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <Button
          color="inherit"
          component={RouterLink}
          to="/dashboard"
          variant="outlined"
          size="small"
        >
          Dashboard
        </Button>
      </>
    );
  }

  return (
    <Box>
      <Button
        color="inherit"
        component={RouterLink}
        to="/login"
        sx={{ mr: 1 }}
      >
        Login
      </Button>
      <Button
        color="inherit"
        component={RouterLink}
        to="/signup"
        variant="outlined"
      >
        Sign Up
      </Button>
    </Box>
  );
};
