import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { Schedule as TimeIcon } from '@mui/icons-material';
import CalendarDatePicker from '../CalendarDatePicker';
import dayjs from '../../../../utils/dayjs';
import TimeSelector from '../TimeSelector';
import { formatDate, formatTime } from '../../../../utils/dashboard/dashboardUtils';
import { canEdit } from './utils';
import type { Appointment, EditData, ValidationErrors, DialogMode } from './types';

interface DateTimeSectionProps {
  appointment: Appointment;
  mode: DialogMode;
  editData: EditData;
  errors: ValidationErrors;
  onFieldChange: (field: keyof EditData, value: string) => void;
}

/**
 * DateTimeSection component
 * Handles date and time display/editing
 */
export const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  appointment,
  mode,
  editData,
  errors,
  onFieldChange,
}) => {
  const isEditable = canEdit(mode);
  const isRescheduleMode = mode === 'reschedule';

  return (
    <Grid size={{ xs: 12 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TimeIcon color="primary" />
        <Typography variant="h6">Date & Time</Typography>
      </Box>

      {isEditable && isRescheduleMode ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <CalendarDatePicker
              label="Date"
              value={editData.date ? dayjs(editData.date).toDate() : null}
              onChange={(date) => onFieldChange('date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
              minDate={new Date()}
              fullWidth
              error={!!errors.date}
              helperText={errors.date || 'Select new appointment date'}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TimeSelector
              label="Start Time"
              value={editData.startTime}
              onChange={(time) => onFieldChange('startTime', time)}
              fullWidth
              error={!!errors.startTime}
              helperText={errors.startTime || 'Select start time'}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TimeSelector
              label="End Time"
              value={editData.endTime}
              onChange={(time) => onFieldChange('endTime', time)}
              fullWidth
              error={!!errors.endTime}
              helperText={errors.endTime || 'Select end time'}
              required
            />
          </Grid>
        </Grid>
      ) : (
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {formatDate(appointment.appointmentDate || appointment.date || '')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
          </Typography>
        </Box>
      )}
    </Grid>
  );
};
