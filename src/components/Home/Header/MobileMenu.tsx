import React from 'react';
import { Menu, MenuItem, Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { NAVIGATION_ITEMS } from './constants';
import { getDisplayName } from './utils';
import type { User } from './types';

interface MobileMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  currentUser?: User | null;
}

/**
 * Mobile menu component
 * Simplified mobile navigation logic
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  anchorEl,
  isOpen,
  onClose,
  isAuthenticated,
  currentUser
}) => {
  const visibleItems = NAVIGATION_ITEMS.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  return (
    <Menu
      anchorEl={anchorEl}
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            mt: 1.5,
            width: 200,
          }
        }
      }}
    >
      {/* Navigation Items */}
      {visibleItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <MenuItem
            key={item.path}
            component={RouterLink}
            to={item.path}
            onClick={onClose}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component={IconComponent} sx={{ mr: 1, fontSize: 'small' }} />
              {item.label}
            </Box>
          </MenuItem>
        );
      })}

      {/* Divider */}
      <Box sx={{ my: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }} />

      {/* User Section */}
      {isAuthenticated ? (
        <>
          <MenuItem disabled>
            <Typography variant="body2" noWrap>
              {getDisplayName(currentUser)}
            </Typography>
          </MenuItem>
          <MenuItem
            component={RouterLink}
            to="/dashboard"
            onClick={onClose}
          >
            Dashboard
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem
            component={RouterLink}
            to="/login"
            onClick={onClose}
          >
            Login
          </MenuItem>
          <MenuItem
            component={RouterLink}
            to="/signup"
            onClick={onClose}
          >
            Sign Up
          </MenuItem>
        </>
      )}
    </Menu>
  );
};
