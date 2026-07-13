import React, { useState, memo, ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Alert,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type {
  SystemSettingData,
  SystemSettingValidationErrors
} from '../../../../types/api';
import type { SettingFormProps } from '../../../../types/components';

/**
 * SettingForm - Form component for adding new system settings
 *
 * Features:
 * - Collapsible form interface
 * - Real-time form validation
 * - Mobile-responsive design
 * - Accessibility support
 * - Clear form state management
 */
const SettingForm = memo(({
  onSave,
  errors = {},
  saving = false,
  isKeyExists,
}: SettingFormProps): React.ReactElement => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [formData, setFormData] = useState<SystemSettingData>({
    key: '',
    value: '',
    description: '',
  });
  const [localErrors, setLocalErrors] = useState<SystemSettingValidationErrors>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleFieldChange = (field: keyof SystemSettingData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear local error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Real-time validation for key uniqueness
    if (field === 'key' && value && isKeyExists) {
      if (isKeyExists(value)) {
        setLocalErrors(prev => ({
          ...prev,
          key: 'This setting key already exists',
        }));
      }
    }
  };

  const handleSave = async (): Promise<void> => {
    // Validate form
    const validationErrors: SystemSettingValidationErrors = {};

    if (!formData.key.trim()) {
      validationErrors.key = 'Setting key is required';
    } else if (formData.key.length < 2) {
      validationErrors.key = 'Setting key must be at least 2 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.key)) {
      validationErrors.key = 'Setting key can only contain letters, numbers, underscores, dots, and hyphens';
    } else if (isKeyExists && isKeyExists(formData.key)) {
      validationErrors.key = 'This setting key already exists';
    }

    if (!formData.value.trim()) {
      validationErrors.value = 'Setting value is required';
    }

    if (!formData.description.trim()) {
      validationErrors.description = 'Setting description is required';
    } else if (formData.description.length < 5) {
      validationErrors.description = 'Description must be at least 5 characters';
    }

    setLocalErrors(validationErrors);

    // If no errors, save the setting
    if (Object.keys(validationErrors).length === 0 && onSave) {
      try {
        await onSave(formData);
        // Auto-collapse and reset form on success
        setExpanded(false);
        setFormData({ key: '', value: '', description: '' });
        setLocalErrors({});
      } catch (err) {
        // Error handling is done by parent component
      }
    }
  };

  const handleCancel = (): void => {
    setFormData({
      key: '',
      value: '',
      description: '',
    });
    setLocalErrors({});
    setExpanded(false);
  };

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
    if (!expanded) {
      // Clear form when expanding
      setFormData({
        key: '',
        value: '',
        description: '',
      });
      setLocalErrors({});
    }
  };

  // Combine local errors with prop errors
  const allErrors = { ...localErrors, ...errors };

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardHeader
        title="Add New Setting"
        action={
          <IconButton
            onClick={toggleExpanded}
            aria-label={expanded ? 'Collapse form' : 'Expand form'}
            color="primary"
          >
            {expanded ? <ExpandLessIcon /> : <AddIcon />}
          </IconButton>
        }
        sx={{ pb: expanded ? 1 : 2 }}
      />
      
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          {Object.keys(allErrors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fix the errors below before saving.
            </Alert>
          )}

          <TextField
            label="Setting Key"
            value={formData.key}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('key', e.target.value)}
            error={Boolean(allErrors.key)}
            helperText={allErrors.key || 'Unique identifier for the setting (e.g., app.theme, max.upload.size)'}
            fullWidth
            margin="normal"
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            placeholder="e.g., app.theme"
            aria-label="Setting key"
            slotProps={{
              htmlInput: {
                pattern: '[a-zA-Z0-9_.-]+',
                title: 'Only letters, numbers, underscores, dots, and hyphens are allowed',
              },
            }}
          />
          
          <TextField
            label="Setting Value"
            value={formData.value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('value', e.target.value)}
            error={Boolean(allErrors.value)}
            helperText={allErrors.value || 'The value for this setting'}
            fullWidth
            margin="normal"
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            multiline
            rows={2}
            placeholder="e.g., dark"
            aria-label="Setting value"
          />
          
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('description', e.target.value)}
            error={Boolean(allErrors.description)}
            helperText={allErrors.description || 'Describe what this setting controls'}
            fullWidth
            margin="normal"
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            multiline
            rows={3}
            placeholder="e.g., Controls the default theme for the application"
            aria-label="Setting description"
          />

          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            gap: 1, 
            justifyContent: 'flex-end',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
              size={isMobile ? 'medium' : 'medium'}
              fullWidth={isMobile}
              aria-label="Cancel adding setting"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              size={isMobile ? 'medium' : 'medium'}
              fullWidth={isMobile}
              aria-label="Save new setting"
            >
              {saving ? 'Adding...' : 'Add Setting'}
            </Button>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
});

SettingForm.displayName = 'SettingForm';

export default SettingForm;
