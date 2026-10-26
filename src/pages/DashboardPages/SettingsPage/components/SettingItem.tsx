import React, { useState, memo, useEffect, ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip,
  TextField,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { SystemSettingData } from '../../../../types/api';
import type { SettingItemProps } from '../../../../types/components';

/**
 * SettingItem - Individual setting display and edit component
 *
 * Features:
 * - Inline editing capability
 * - Expandable description view
 * - Form validation
 * - Mobile-responsive design
 * - Accessibility support
 */
const SettingItem = memo(({
  setting,
  onSave,
  onCancel,
  isEditing,
  onEdit,
  errors = {},
  saving = false,
}: SettingItemProps): React.ReactElement => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [editData, setEditData] = useState<SystemSettingData>({
    key: setting.key || '',
    value: setting.value || '',
    description: setting.description || '',
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Update edit data when setting changes or editing starts
  useEffect(() => {
    if (isEditing) {
      setEditData({
        key: setting.key || '',
        value: setting.value || '',
        description: setting.description || '',
      });
    }
  }, [isEditing, setting]);

  const handleFieldChange = (field: keyof SystemSettingData, value: string): void => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (): void => {
    if (onSave) {
      onSave(editData);
    }
  };

  const handleCancel = (): void => {
    setEditData({
      key: setting.key || '',
      value: setting.value || '',
      description: setting.description || '',
    });
    if (onCancel) {
      onCancel();
    }
  };

  const handleEdit = (): void => {
    if (onEdit) {
      onEdit(setting);
    }
  };

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  return (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 2,
        '&:hover': {
          elevation: 2,
          boxShadow: theme.shadows[2],
        },
      }}
    >
      <CardContent>
        {isEditing ? (
          // Edit Mode
          <Box>
            <TextField
              label="Setting key"
              value={editData.key}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('key', e.target.value)}
              error={Boolean(errors.key)}
              helperText={errors.key}
              fullWidth
              margin="normal"
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              disabled={Boolean(setting.id)} // Disable key editing for existing settings
              aria-label="Setting key"
            />
            
            <TextField
              label="Setting value"
              value={editData.value}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('value', e.target.value)}
              error={Boolean(errors.value)}
              helperText={errors.value}
              fullWidth
              margin="normal"
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              multiline
              rows={2}
              aria-label="Setting value"
            />
            
            <TextField
              label="Description"
              value={editData.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('description', e.target.value)}
              error={Boolean(errors.description)}
              helperText={errors.description}
              fullWidth
              margin="normal"
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              multiline
              rows={3}
              aria-label="Setting description"
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
                size={isMobile ? 'small' : 'medium'}
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                size={isMobile ? 'small' : 'medium'}
                aria-label="Save setting"
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </Box>
        ) : (
          // View Mode
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0,
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip 
                    label={setting.key} 
                    variant="outlined" 
                    size="small"
                    color="primary"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Box>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 1,
                    wordBreak: 'break-word',
                    fontWeight: 500,
                  }}
                >
                  {setting.value}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: expanded ? 'block' : '-webkit-box',
                      WebkitLineClamp: expanded ? 'none' : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                  >
                    {setting.description}
                  </Typography>
                  
                  {setting.description && setting.description.length > 100 && (
                    <IconButton
                      size="small"
                      onClick={toggleExpanded}
                      aria-label={expanded ? 'Show less' : 'Show more'}
                      sx={{ ml: 'auto' }}
                    >
                      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </Box>
              </Box>

              <IconButton
                onClick={handleEdit}
                size="small"
                color="primary"
                aria-label="Edit setting"
                sx={{ 
                  alignSelf: isMobile ? 'flex-end' : 'flex-start',
                  mt: isMobile ? -1 : 0,
                }}
              >
                <EditIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

SettingItem.displayName = 'SettingItem';

export default SettingItem;
