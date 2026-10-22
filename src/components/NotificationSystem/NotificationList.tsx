import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  MedicalServices as MedicalServicesIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNotifications } from './NotificationContext';
import { filterNotifications, formatTimeAgo, getNotificationColor } from './NotificationUtils';
import type { Notification } from '../../types/components';

interface NotificationListProps {
  notifications: Notification[];
  filterType: string;
}

/**
 * Notification List Component
 * Displays filtered list of notifications
 */
export const NotificationList: React.FC<NotificationListProps> = ({ 
  notifications, 
  filterType: initialFilterType 
}) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const [filterType, setFilterType] = React.useState<string>(initialFilterType);

  React.useEffect(() => {
    setFilterType(initialFilterType);
  }, [initialFilterType]);

  const getNotificationIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'appointment':
        return <EventIcon />;
      case 'medical':
        return <MedicalServicesIcon />;
      case 'patient':
        return <PersonIcon />;
      case 'system':
        return <SettingsIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'security':
        return <SecurityIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'success':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const filteredNotifications = filterNotifications(notifications, filterType);

  return (
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      {/* Filter Controls */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filterType}
            label="Filter"
            onChange={(e) => setFilterType(e.target.value as string)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="unread">Unread</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="appointment">Appointments</MenuItem>
            <MenuItem value="medical">Medical</MenuItem>
            <MenuItem value="patient">Patients</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredNotifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {filterType === 'all' ? 'No notifications yet' : `No ${filterType} notifications`}
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {filteredNotifications.map((notification) => (
            <Fade in timeout={300} key={notification.id}>
              <ListItem
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  borderLeft: notification.urgent ? '4px solid' : 'none',
                  borderColor: 'error.main',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: `${getNotificationColor(notification.type)}.main`,
                      width: 32,
                      height: 32,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemIcon>

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: notification.read ? 'normal' : 'bold',
                        flexGrow: 1,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    {notification.urgent && (
                      <Chip label="Urgent" color="error" size="small" />
                    )}
                    {notification.priority === 'high' && !notification.urgent && (
                      <Chip label="High" color="warning" size="small" />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeAgo(notification.timestamp)}
                    </Typography>
                  </Box>
                </Box>

                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </Fade>
          ))}
        </List>
      )}
    </Box>
  );
};
