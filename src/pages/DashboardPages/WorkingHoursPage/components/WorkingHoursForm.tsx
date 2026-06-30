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
import { WorkingHours, DayOfWeek, CreateWorkingHoursRequest } from '../../../../types';
import useFormValidation from '../../../../hooks/useFormValidation';

interface WorkingHoursFormProps {
  open: boolean;
  workingHours?: WorkingHours | null;
  clinicId: number;
  onClose: () => void;
  onSaved: () => void;
}

interface WorkingHoursFormData {
  dayOfWeek: DayOfWeek;
  specificDate: Dayjs | null;
  openingTime: Dayjs | null;
  closingTime: Dayjs | null;
  breakStartTime: Dayjs | null;
  breakEndTime: Dayjs | null;
  isClosed: boolean;
  isEmergencyHours: boolean;
  notes: string;
}

const dayOfWeekOptions: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

/**
 * WorkingHoursForm - Form component for creating and editing working hours
 *
 * Features:
 * - Create new working hours or edit existing ones
 * - Comprehensive form validation
 * - Date and time pickers for scheduling
 * - Day of week selection
 * - Break time configuration
 * - Emergency hours support
 * - Responsive design with mobile optimization
 */
const WorkingHoursForm: React.FC<WorkingHoursFormProps> = ({
  open,
  workingHours,
  clinicId,
  onClose,
  onSaved
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { validateField, getFieldError, hasFieldError, clearValidationErrors } = useFormValidation();

  // Form state
  const [formData, setFormData] = useState<WorkingHoursFormData>({
    dayOfWeek: 'MONDAY',
    specificDate: null,
    openingTime: null,
    closingTime: null,
    breakStartTime: null,
    breakEndTime: null,
    isClosed: false,
    isEmergencyHours: false,
    notes: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Initialize form data when workingHours prop changes
  useEffect(() => {
    if (workingHours) {
      setFormData({
        dayOfWeek: workingHours.dayOfWeek,
        specificDate: workingHours.specificDate ? dayjs(workingHours.specificDate) : null,
        openingTime: workingHours.openingTime ? dayjs(workingHours.openingTime, 'HH:mm') : null,
        closingTime: workingHours.closingTime ? dayjs(workingHours.closingTime, 'HH:mm') : null,
        breakStartTime: workingHours.breakStartTime ? dayjs(workingHours.breakStartTime, 'HH:mm') : null,
        breakEndTime: workingHours.breakEndTime ? dayjs(workingHours.breakEndTime, 'HH:mm') : null,
        isClosed: workingHours.isClosed,
        isEmergencyHours: workingHours.isEmergencyHours,
        notes: workingHours.notes || '',
      });
    } else {
      // Reset form for new working hours
      setFormData({
        dayOfWeek: 'MONDAY',
        specificDate: null,
        openingTime: dayjs().hour(9).minute(0), // Default 9:00 AM
        closingTime: dayjs().hour(17).minute(0), // Default 5:00 PM
        breakStartTime: null,
        breakEndTime: null,
        isClosed: false,
        isEmergencyHours: false,
        notes: '',
      });
    }
    clearValidationErrors();
    setError('');
  }, [workingHours, open, clearValidationErrors]);

  // Handle form field changes
  const handleFieldChange = (field: keyof WorkingHoursFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle select changes
  const handleSelectChange = (event: SelectChangeEvent<DayOfWeek>) => {
    handleFieldChange('dayOfWeek', event.target.value as DayOfWeek);
  };

  // Handle switch changes
  const handleSwitchChange = (field: 'isClosed' | 'isEmergencyHours') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFieldChange(field, event.target.checked);
    
    // Clear times when clinic is closed
    if (field === 'isClosed' && event.target.checked) {
      setFormData(prev => ({
        ...prev,
        isClosed: true,
        openingTime: null,
        closingTime: null,
        breakStartTime: null,
        breakEndTime: null,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.isClosed) {
      if (!formData.openingTime || !formData.closingTime) {
        setError('Opening and closing times are required when clinic is open');
        return false;
      }

      if (formData.openingTime.isAfter(formData.closingTime)) {
        setError('Opening time must be before closing time');
        return false;
      }

      // Validate break times if provided
      if (formData.breakStartTime && formData.breakEndTime) {
        if (formData.breakStartTime.isAfter(formData.breakEndTime)) {
          setError('Break start time must be before break end time');
          return false;
        }

        if (formData.breakStartTime.isBefore(formData.openingTime) || 
            formData.breakEndTime.isAfter(formData.closingTime)) {
          setError('Break times must be within opening hours');
          return false;
        }
      }

      if ((formData.breakStartTime && !formData.breakEndTime) || 
          (!formData.breakStartTime && formData.breakEndTime)) {
        setError('Both break start and end times are required for break periods');
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
      const workingHoursData: CreateWorkingHoursRequest = {
        dayOfWeek: formData.dayOfWeek,
        specificDate: formData.specificDate?.format('YYYY-MM-DD'),
        openingTime: formData.isClosed ? '' : formData.openingTime?.format('HH:mm') || '',
        closingTime: formData.isClosed ? '' : formData.closingTime?.format('HH:mm') || '',
        breakStartTime: formData.breakStartTime?.format('HH:mm'),
        breakEndTime: formData.breakEndTime?.format('HH:mm'),
        isClosed: formData.isClosed,
        isEmergencyHours: formData.isEmergencyHours,
        notes: formData.notes.trim() || undefined,
      };

      await api.clinic.createWorkingHours(clinicId, workingHoursData);
      onSaved();
    } catch (err: any) {
      console.error('Error saving working hours:', err);
      setError(err.message || 'Failed to save working hours');
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
            {workingHours ? 'Edit Working Hours' : 'Add New Working Hours'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Day of Week */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={formData.dayOfWeek}
                  onChange={handleSelectChange}
                  label="Day of Week"
                  disabled={loading}
                >
                  {dayOfWeekOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Specific Date (Optional) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Specific Date (Optional)"
                value={formData.specificDate}
                onChange={(date) => handleFieldChange('specificDate', date)}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave empty for regular weekly schedule'
                  }
                }}
              />
            </Grid>

            {/* Closed Switch */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isClosed}
                    onChange={handleSwitchChange('isClosed')}
                    disabled={loading}
                  />
                }
                label="Clinic Closed"
              />
            </Grid>

            {/* Opening and Closing Times (only if not closed) */}
            {!formData.isClosed && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TimePicker
                    label="Opening Time"
                    value={formData.openingTime}
                    onChange={(time) => handleFieldChange('openingTime', time)}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: !formData.isClosed,
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TimePicker
                    label="Closing Time"
                    value={formData.closingTime}
                    onChange={(time) => handleFieldChange('closingTime', time)}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: !formData.isClosed,
                      }
                    }}
                  />
                </Grid>

                {/* Break Times */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TimePicker
                    label="Break Start Time (Optional)"
                    value={formData.breakStartTime}
                    onChange={(time) => handleFieldChange('breakStartTime', time)}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TimePicker
                    label="Break End Time (Optional)"
                    value={formData.breakEndTime}
                    onChange={(time) => handleFieldChange('breakEndTime', time)}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      }
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Emergency Hours Switch */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isEmergencyHours}
                    onChange={handleSwitchChange('isEmergencyHours')}
                    disabled={loading}
                  />
                }
                label="Emergency Hours"
              />
            </Grid>

            {/* Notes */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                multiline
                rows={3}
                placeholder="Additional notes about these working hours"
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
            {loading ? 'Saving...' : 'Save Working Hours'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default WorkingHoursForm;
