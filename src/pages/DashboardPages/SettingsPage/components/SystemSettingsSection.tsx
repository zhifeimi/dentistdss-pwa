import React, { useState, memo, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Alert,
  LinearProgress,
  TextField,
  InputAdornment,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import useSystemSettings from '../../../../hooks/useSystemSettings';
import SettingItem from './SettingItem';
import SettingForm from './SettingForm';
import type {
  SystemSetting,
  SystemSettingData,
  SystemSettingValidationErrors
} from '../../../../types/api';

/**
 * SystemSettingsSection - System administration settings management
 *
 * Features:
 * - Load and display all system settings
 * - Add new settings
 * - Edit existing settings
 * - Search/filter settings
 * - Real-time validation
 * - Mobile-responsive design
 */
const SystemSettingsSection = memo((): React.ReactElement => {
  const [editingSettingId, setEditingSettingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editErrors, setEditErrors] = useState<SystemSettingValidationErrors>({});
  const [formKey, setFormKey] = useState<number>(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    settings,
    loading,
    saving,
    error,
    saveSetting,
    validateSetting,
    isKeyExists,
    clearError,
  } = useSystemSettings();

  // Filter settings based on search query
  const filteredSettings = settings.filter((setting: SystemSetting) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      setting.key.toLowerCase().includes(query) ||
      setting.value.toLowerCase().includes(query) ||
      setting.description.toLowerCase().includes(query)
    );
  });

  const handleAddSetting = async (settingData: SystemSettingData): Promise<void> => {
    try {
      await saveSetting(settingData);

      // Show success notification
      const event = new CustomEvent('show-snackbar', {
        detail: {
          message: 'Setting added successfully',
          severity: 'success',
        },
      });
      window.dispatchEvent(event);

      // Reset form by changing key to force re-render
      setFormKey(prev => prev + 1);
    } catch (err) {
      // Error is handled by the hook and global error system
    }
  };

  const handleEditSetting = (setting: SystemSetting): void => {
    setEditingSettingId(setting.id);
    setEditErrors({});
  };

  const handleSaveEdit = async (settingData: SystemSettingData): Promise<void> => {
    // Validate the setting data
    const errors = validateSetting(settingData);

    // Check for key uniqueness (excluding current setting)
    const editingSetting = settings.find(s => s.id === editingSettingId);
    if (editingSetting && settingData.key !== editingSetting.key && isKeyExists(settingData.key, editingSettingId)) {
      errors.key = 'This setting key already exists';
    }

    setEditErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        await saveSetting(settingData);

        // Show success notification
        const event = new CustomEvent('show-snackbar', {
          detail: {
            message: 'Setting updated successfully',
            severity: 'success',
          },
        });
        window.dispatchEvent(event);

        setEditingSettingId(null);
        setEditErrors({});
      } catch (err) {
        // Error is handled by the hook and global error system
      }
    }
  };

  const handleCancelEdit = (): void => {
    setEditingSettingId(null);
    setEditErrors({});
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Loading system settings…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {settings.length} setting{settings.length !== 1 ? 's' : ''} configured
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Add new setting Form */}
      <SettingForm
        key={formKey}
        onSave={handleAddSetting}
        saving={saving}
        isKeyExists={isKeyExists}
      />

      {/* Search Filter */}
      {settings.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <TextField
            label="Search settings"
            value={searchQuery}
            onChange={handleSearchChange}
            fullWidth
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            placeholder="Search by key, value, or description…"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            aria-label="Search settings"
          />
        </Paper>
      )}

      {/* Settings List */}
      {filteredSettings.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchQuery.trim() 
            ? `No settings found matching "${searchQuery}"`
            : 'No system settings configured yet. Add your first setting above.'
          }
        </Alert>
      ) : (
        <Box>
          {filteredSettings.map((setting) => (
            <SettingItem
              key={setting.id}
              setting={setting}
              isEditing={editingSettingId === setting.id}
              onEdit={handleEditSetting}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              errors={editingSettingId === setting.id ? editErrors : {}}
              saving={saving}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

SystemSettingsSection.displayName = 'SystemSettingsSection';

export default SystemSettingsSection;
