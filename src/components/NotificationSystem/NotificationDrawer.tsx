import React, { useState, ChangeEvent } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNotifications } from './NotificationContext';
import { NotificationList } from './NotificationList';
import { NotificationSettings } from './NotificationSettings';
import type { NotificationDrawerProps } from '../../types/components';

/**
 * Notification Drawer Component
 * Main drawer that contains notifications list and settings
 */
export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ 
  open, 
  onClose, 
  notifications 
}) => {
  const {
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const getFilterType = (): string => {
    switch (activeTab) {
      case 0: return 'all';
      case 1: return 'unread';
      case 2: return 'urgent';
      default: return 'all';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Settings">
              <IconButton
                onClick={() => setShowSettings(!showSettings)}
                color={showSettings ? 'primary' : 'default'}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mt: 1 }}
        >
          <Tab label="All" />
          <Tab label="Unread" />
          <Tab label="Urgent" />
        </Tabs>

        {/* Action Buttons */}
        {!showSettings && notifications.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              size="small"
              startIcon={<MarkEmailReadIcon />}
              onClick={markAllAsRead}
              variant="outlined"
            >
              Mark all read
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearAllNotifications}
              variant="outlined"
            >
              Clear all
            </Button>
          </Box>
        )}
      </Box>

      {/* Content */}
      {showSettings ? (
        <NotificationSettings />
      ) : (
        <NotificationList 
          notifications={notifications}
          filterType={getFilterType()}
        />
      )}
    </Drawer>
  );
};
