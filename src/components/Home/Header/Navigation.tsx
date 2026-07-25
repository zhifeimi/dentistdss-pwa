import React from 'react';
import { Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { NAVIGATION_ITEMS } from './constants';

interface NavigationProps {
  isAuthenticated: boolean;
}

/**
 * Desktop navigation component
 * Simplified navigation logic
 */
export const Navigation: React.FC<NavigationProps> = ({ isAuthenticated }) => {
  const visibleItems = NAVIGATION_ITEMS.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {visibleItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Button
            key={item.path}
            color="inherit"
            component={RouterLink}
            to={item.path}
            startIcon={<IconComponent />}
            sx={{ mr: 1 }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};
