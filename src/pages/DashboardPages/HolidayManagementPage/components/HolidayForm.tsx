import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  SelectChangeEvent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../../../services';
import { Holiday, HolidayType, CreateHolidayRequest } from '../../../../types';
import useFormValidation from '../../../../hooks/useFormValidation';

interface HolidayFormProps {
  open: boolean;
  holiday?: Holiday | null;
  clinicId: number;
  onClose: () => void;
  onSaved: () => void;
}

interface HolidayFormData {
  name: string;
  holidayDate: Dayjs | null;
  description: string;
  type: HolidayType;
  isFullDayClosure: boolean;
  specialOpeningTime: Dayjs | null;
  specialClosingTime: Dayjs | null;
  isRecurring: boolean;
  emergencyContact: string;
}

const holidayTypeOptions: { value: HolidayType; label: string }[] = [
  { value: 'NATIONAL_HOLIDAY', label: 'National Holiday' },
  { value: 'CLINIC_CLOSURE', label: 'Clinic Closure' },
  { value: 'STAFF_TRAINING', label: 'Staff Training' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'EMERGENCY_CLOSURE', label: 'Emergency Closure' },
  { value: 'VACATION', label: 'Vacation' },
  { value: 'OTHER', label: 'Other' },
];

/**
 * HolidayForm - Form component for creating and editing holidays
 *
 * Features:
 * - Create new holidays or edit existing ones
 * - Comprehensive form validation
 * - Date and time pickers for scheduling
 * - Holiday type selection
 * - Full-day closure or special hours options
 * - Recurring holiday support
 * - Emergency contact information
 * - Responsive design with mobile optimization
 */
const HolidayForm: React.FC<HolidayFormProps> = ({
  open,
  holiday,
  clinicId,
  onClose,
  onSaved
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { validateField, getFieldError, hasFieldError, clearValidationErrors } = useFormValidation();

  // Form state
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    holidayDate: null,
    description: '',
    type: 'NATIONAL_HOLIDAY',
    isFullDayClosure: true,
    specialOpeningTime: null,
    specialClosingTime: null,
    isRecurring: false,
    emergencyContact: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Initialize form data when holiday prop changes
  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name,
        holidayDate: dayjs(holiday.holidayDate),
        description: holiday.description,
        type: holiday.type,
        isFullDayClosure: holiday.isFullDayClosure,
        specialOpeningTime: holiday.specialOpeningTime ? dayjs(holiday.specialOpeningTime, 'HH:mm') : null,
        specialClosingTime: holiday.specialClosingTime ? dayjs(holiday.specialClosingTime, 'HH:mm') : null,
        isRecurring: holiday.isRecurring,
        emergencyContact: holiday.emergencyContact || '',
      });
    } else {
      // Reset form for new holiday
      setFormData({
        name: '',
        holidayDate: null,
        description: '',
        type: 'NATIONAL_HOLIDAY',
        isFullDayClosure: true,
        specialOpeningTime: null,
        specialClosingTime: null,
        isRecurring: false,
        emergencyContact: '',
      });
    }
    clearValidationErrors();
    setError('');
  }, [holiday, open, clearValidationErrors]);

  // Handle form field changes
  const handleFieldChange = (field: keyof HolidayFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle select changes
  const handleSelectChange = (event: SelectChangeEvent<HolidayType>) => {
    handleFieldChange('type', event.target.value as HolidayType);
  };

  // Handle switch changes
  const handleSwitchChange = (field: 'isFullDayClosure' | 'isRecurring') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFieldChange(field, event.target.checked);
    
    // Clear special hours when switching to full day closure
    if (field === 'isFullDayClosure' && event.target.checked) {
      setFormData(prev => ({
        ...prev,
        isFullDayClosure: true,
        specialOpeningTime: null,
        specialClosingTime: null,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Holiday name is required');
      return false;
    }

    if (!formData.holidayDate) {
      setError('Holiday date is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }

    // Validate special hours if not full day closure
    if (!formData.isFullDayClosure) {
      if (!formData.specialOpeningTime || !formData.specialClosingTime) {
        setError('Special opening and closing times are required when not a full day closure');
        return false;
      }

      if (formData.specialOpeningTime.isAfter(formData.specialClosingTime)) {
        setError('Opening time must be before closing time');
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const holidayData: CreateHolidayRequest = {
        name: formData.name.trim(),
        holidayDate: formData.holidayDate!.format('YYYY-MM-DD'),
        description: formData.description.trim(),
        type: formData.type,
        isFullDayClosure: formData.isFullDayClosure,
        specialOpeningTime: formData.isFullDayClosure ? undefined : formData.specialOpeningTime?.format('HH:mm'),
        specialClosingTime: formData.isFullDayClosure ? undefined : formData.specialClosingTime?.format('HH:mm'),
        isRecurring: formData.isRecurring,
        emergencyContact: formData.emergencyContact.trim() || undefined,
      };

      await api.clinic.createHoliday(clinicId, holidayData);
      onSaved();
    } catch (err: any) {
      console.error('Error saving holiday:', err);
      setError(err.message || 'Failed to save holiday');
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            minHeight: isMobile ? '100vh' : '600px',
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            {holiday ? 'Edit Holiday' : 'Add New Holiday'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Holiday Name */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Holiday Name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                error={hasFieldError('name')}
                helperText={getFieldError('name')}
                required
                disabled={loading}
              />
            </Grid>

            {/* Holiday Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Holiday Date"
                value={formData.holidayDate}
                onChange={(date) => handleFieldChange('holidayDate', date)}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !formData.holidayDate && error.includes('date'),
                  }
                }}
              />
            </Grid>

            {/* Holiday Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Holiday Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleSelectChange}
                  label="Holiday Type"
                  disabled={loading}
                >
                  {holidayTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                multiline
                rows={3}
                required
                disabled={loading}
              />
            </Grid>

            {/* Full Day Closure Switch */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFullDayClosure}
                    onChange={handleSwitchChange('isFullDayClosure')}
                    disabled={loading}
                  />
                }
                label="Full Day Closure"
              />
            </Grid>

            {/* Special Hours (only if not full day closure) */}
            {!formData.isFullDayClosure && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TimePicker
                    label="Special Opening Time"
                    value={formData.specialOpeningTime}
                    onChange={(time) => handleFieldChange('specialOpeningTime', time)}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: !formData.isFullDayClosure,
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TimePicker
                    label="Special Closing Time"
                    value={formData.specialClosingTime}
                    onChange={(time) => handleFieldChange('specialClosingTime', time)}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: !formData.isFullDayClosure,
                      }
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Recurring Holiday Switch */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurring}
                    onChange={handleSwitchChange('isRecurring')}
                    disabled={loading}
                  />
                }
                label="Recurring Holiday (Annual)"
              />
            </Grid>

            {/* Emergency Contact */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Emergency Contact (Optional)"
                value={formData.emergencyContact}
                onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                placeholder="Phone number or contact information for emergencies"
                disabled={loading}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save Holiday'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default HolidayForm;
