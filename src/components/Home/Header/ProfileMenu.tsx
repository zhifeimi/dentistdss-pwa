import React from 'react';
import {
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';
import { getDisplayName, getUserInitials, getAvatarSrc, hasAvatarImage } from './utils';
import type { User } from './types';

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onOpen: (event: React.MouseEvent<HTMLElement>) => void;
  currentUser?: User | null;
}

/**
 * Profile menu component
 * Simplified profile menu logic
 */
export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  anchorEl,
  isOpen,
  onClose,
  onOpen,
  currentUser
}) => {
  if (!currentUser) return null;

  return (
    <>
      <IconButton
        onClick={onOpen}
        color="inherit"
        sx={{ ml: 1 }}
      >
        <Avatar
          src={getAvatarSrc(currentUser)}
          sx={{
            width: 32,
            height: 32,
            bgcolor: !hasAvatarImage(currentUser) ? 'primary.main' : 'transparent',
          }}
        >
          {!hasAvatarImage(currentUser) && getUserInitials(currentUser)}
        </Avatar>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">
            {getDisplayName(currentUser)}
          </Typography>
        </MenuItem>
        
        <Divider />
        
        <MenuItem component={RouterLink} to="/profile" onClick={onClose}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        
        <MenuItem component={RouterLink} to="/settings" onClick={onClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        
        <Divider />
        
        <MenuItem component={RouterLink} to="/dashboard" onClick={onClose}>
          <ListItemIcon>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          Dashboard
        </MenuItem>
      </Menu>
    </>
  );
};
