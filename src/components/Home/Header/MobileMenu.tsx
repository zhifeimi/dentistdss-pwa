import React from 'react';
import { Divider, Menu, MenuItem } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { NAVIGATION_ITEMS } from './constants';

interface MobileMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  anchorEl,
  isOpen,
  onClose,
  isAuthenticated,
}) => {
  const visibleItems = NAVIGATION_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated);
  const accountItems = isAuthenticated
    ? [{ label: 'Dashboard', path: '/dashboard' }]
    : [
      { label: 'Log in', path: '/login' },
      { label: 'Sign up', path: '/signup' },
    ];

  return (
    <Menu
      anchorEl={anchorEl}
      open={isOpen}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { mt: 1, width: 220 } } }}
    >
      {visibleItems.map((item) => (
        <MenuItem key={item.path} component={RouterLink} to={item.path} onClick={onClose}>
          {item.label}
        </MenuItem>
      ))}
      <Divider />
      {accountItems.map((item) => (
        <MenuItem key={item.path} component={RouterLink} to={item.path} onClick={onClose}>
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
};
