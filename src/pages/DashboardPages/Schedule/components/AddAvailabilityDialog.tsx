import React, { useState, ChangeEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Box,
  Grid,
  Switch,
  Alert,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '../../../../utils/dayjs';
import type {
  AddAvailabilityDialogProps,
  AvailabilityFormData,
  AvailabilitySubmitData
} from '../../../../types/components';

/**
 * Dialog for adding new availability slots
 * Supports both recurring and one-time slots
 */
const AddAvailabilityDialog: React.FC<AddAvailabilityDialogProps> = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState<AvailabilityFormData>({
    isRecurring: true,
    dayOfWeek: 1, // Monday
    startTime: null,
    endTime: null,
    effectiveFrom: new Date(),
    effectiveUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)) // 3 months from now
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  /**
   * Handle form field changes
   */
  const handleChange = (field: keyof AvailabilityFormData, value: any): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }

      // Check for minimum duration (e.g., 15 minutes)
      const duration = formData.endTime.getTime() - formData.startTime.getTime();
      const minDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
      if (duration < minDuration) {
        newErrors.endTime = 'Minimum slot duration is 15 minutes';
      }
    }

    if (!formData.effectiveFrom) {
      newErrors.effectiveFrom = 'Effective from date is required';
    } else {
      // Check if effective from date is not in the past (for one-time slots)
      if (!formData.isRecurring) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (formData.effectiveFrom < today) {
          newErrors.effectiveFrom = 'Date cannot be in the past';
        }
      }
    }

    if (formData.isRecurring && !formData.effectiveUntil) {
      newErrors.effectiveUntil = 'Effective until date is required for recurring slots';
    }

    if (formData.effectiveFrom && formData.effectiveUntil) {
      if (formData.effectiveFrom >= formData.effectiveUntil) {
        newErrors.effectiveUntil = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Format time to HH:mm:ss string
   */
  const formatTimeForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  /**
   * Format date to YYYY-MM-DD string
   */
  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const submitData: AvailabilitySubmitData = {
        isRecurring: formData.isRecurring,
        dayOfWeek: formData.isRecurring ? formData.dayOfWeek : formData.effectiveFrom.getDay(),
        startTime: formatTimeForAPI(formData.startTime),
        endTime: formatTimeForAPI(formData.endTime),
        effectiveFrom: formatDateForAPI(formData.effectiveFrom),
        effectiveUntil: formatDateForAPI(formData.effectiveUntil)
      };

      await onSubmit(submitData);
      handleClose();
    } catch (err: any) {
      console.error('Failed to create availability:', err);
      setErrors({ submit: err.message || 'Failed to create availability' });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = (): void => {
    setFormData({
      isRecurring: true,
      dayOfWeek: 1,
      startTime: null,
      endTime: null,
      effectiveFrom: new Date(),
      effectiveUntil: new Date(new Date().setMonth(new Date().getMonth() + 3))
    });
    setErrors({});
    setSubmitting(false);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={(_event, reason) => {
          if (submitting && reason === 'escapeKeyDown') return;
          handleClose();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Availability Slot</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.submit}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Recurring vs One-time */}
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Availability Type</FormLabel>
                  <RadioGroup
                    value={formData.isRecurring ? 'recurring' : 'onetime'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('isRecurring', e.target.value === 'recurring')}
                    row
                  >
                    <FormControlLabel
                      value="recurring"
                      control={<Radio />}
                      label="Recurring (weekly)"
                    />
                    <FormControlLabel
                      value="onetime"
                      control={<Radio />}
                      label="One-time"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Day of Week (for recurring) */}
              {formData.isRecurring && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={!!errors.dayOfWeek}>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={formData.dayOfWeek}
                      onChange={(e: SelectChangeEvent<number>) => handleChange('dayOfWeek', e.target.value)}
                      label="Day of Week"
                    >
                      {daysOfWeek.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Time Range */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TimePicker
                  label="Start Time"
                  value={formData.startTime ? dayjs(formData.startTime) : null}
                  onChange={(value) => handleChange('startTime', value && 'toDate' in value ? (value as any).toDate() : value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.startTime,
                      helperText: errors.startTime
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TimePicker
                  label="End Time"
                  value={formData.endTime ? dayjs(formData.endTime) : null}
                  onChange={(value) => handleChange('endTime', value && 'toDate' in value ? (value as any).toDate() : value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.endTime,
                      helperText: errors.endTime
                    }
                  }}
                />
              </Grid>

              {/* Date Range */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label={formData.isRecurring ? "Effective From" : "Date"}
                  value={formData.effectiveFrom ? dayjs(formData.effectiveFrom) : null}
                  onChange={(value) => handleChange('effectiveFrom', value && 'toDate' in value ? (value as any).toDate() : value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.effectiveFrom,
                      helperText: errors.effectiveFrom
                    }
                  }}
                />
              </Grid>

              {formData.isRecurring && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Effective Until"
                    value={formData.effectiveUntil ? dayjs(formData.effectiveUntil) : null}
                    onChange={(value) => handleChange('effectiveUntil', value && 'toDate' in value ? (value as any).toDate() : value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.effectiveUntil,
                        helperText: errors.effectiveUntil
                      }
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || loading}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {submitting ? 'Creating...' : 'Create Availability'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddAvailabilityDialog;
