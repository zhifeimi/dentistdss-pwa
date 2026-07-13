import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  MailOutlined as MailOutlineIcon,
  Sms as SmsIcon,
  Event as EventIcon,
  MedicalServices as MedicalServicesIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNotifications } from './NotificationContext';
import type { NotificationSettings as NotificationSettingsType } from '../../types/components';

/**
 * Notification Settings Component
 * Allows users to configure notification preferences
 */
export const NotificationSettings: React.FC = () => {
  const { settings, updateSettings, requestDesktopPermission } = useNotifications();

  const handleSettingsChange = (key: keyof NotificationSettingsType, value: any): void => {
    updateSettings({ [key]: value });
  };

  const handleTypeSettingChange = (type: keyof NotificationSettingsType['types'], enabled: boolean): void => {
    updateSettings({
      types: {
        ...settings.types,
        [type]: enabled
      }
    });
  };

  const handleQuietHoursChange = (key: keyof NotificationSettingsType['quietHours'], value: any): void => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        [key]: value
      }
    });
  };

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
      default:
        return <SettingsIcon />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Notification Settings
      </Typography>

      {/* General Settings */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            General
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => handleSettingsChange('enabled', e.target.checked)}
              />
            }
            label="Enable notifications"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.sound}
                onChange={(e) => handleSettingsChange('sound', e.target.checked)}
                disabled={!settings.enabled}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {settings.sound ? <VolumeUpIcon /> : <VolumeOffIcon />}
                Sound alerts
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.desktop}
                onChange={(e) => {
                  handleSettingsChange('desktop', e.target.checked);
                  if (e.target.checked) {
                    requestDesktopPermission();
                  }
                }}
                disabled={!settings.enabled}
              />
            }
            label="Desktop notifications"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.email}
                onChange={(e) => handleSettingsChange('email', e.target.checked)}
                disabled={!settings.enabled}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MailOutlineIcon />
                Email notifications
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.sms}
                onChange={(e) => handleSettingsChange('sms', e.target.checked)}
                disabled={!settings.enabled}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmsIcon />
                SMS notifications
              </Box>
            }
          />
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Notification Types
          </Typography>

          {Object.entries(settings.types).map(([type, enabled]) => (
            <FormControlLabel
              key={type}
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => handleTypeSettingChange(type as keyof NotificationSettingsType['types'], e.target.checked)}
                  disabled={!settings.enabled}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getNotificationIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Box>
              }
            />
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Quiet Hours
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.quietHours.enabled}
                onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                disabled={!settings.enabled}
              />
            }
            label="Enable quiet hours"
          />

          {settings.quietHours.enabled && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <TextField
                label="Start time"
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End time"
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
