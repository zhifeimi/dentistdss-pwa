import React from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { Dentist } from '../../../../../types/api';

interface AvailableSlot {
  startTime: string;
  endTime: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface DateTimeSelectionStepProps {
  selectedClinic: string | number;
  selectedDate: string;
  selectedTime: string;
  selectedDentist: string | number;
  dentists: Dentist[];
  availableSlots: AvailableSlot[];
  onSelectDate: (date: string) => void;
  onSelectTime: (startTime: string, endTime: string) => void;
  onSelectDentist: (dentistId: string) => void;
  errors: ValidationErrors;
  loading: boolean;
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * DateTimeSelectionStep - Select an authoritative slot for the chosen service.
 */
const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({
  selectedClinic,
  selectedDate,
  selectedTime,
  selectedDentist,
  dentists,
  availableSlots,
  onSelectDate,
  onSelectTime,
  onSelectDentist,
  errors,
  loading,
}) => {
  if (!selectedClinic) {
    return (
      <Alert severity='info'>
        Please select a clinic first.
      </Alert>
    );
  }

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const dentistError = errors.dentistId || errors.dentists;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Select Time & Dentist
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Choose a date, dentist, and duration-aware available time.
      </Typography>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth error={!!dentistError}>
            <InputLabel>Preferred Dentist</InputLabel>
            <Select
              value={selectedDentist || ''}
              label='Preferred Dentist'
              onChange={(event) => onSelectDentist(String(event.target.value))}
              disabled={loading}
            >
              {loading && dentists.length === 0
                ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading dentists...
                  </MenuItem>
                )
                : dentists.length === 0
                ? <MenuItem disabled>No dentists available</MenuItem>
                : (
                  dentists.map((dentist) => (
                    <MenuItem key={dentist.id} value={dentist.id}>
                      {dentist.firstName} {dentist.lastName} -{' '}
                      {dentist.specialty || 'General Dentistry'}
                    </MenuItem>
                  ))
                )}
            </Select>
            {dentistError && (
              <Typography variant='caption' color='error' sx={{ mt: 1 }}>
                {dentistError}
              </Typography>
            )}
          </FormControl>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type='date'
            label='Appointment date'
            value={selectedDate}
            onChange={(event) => onSelectDate(event.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: formatLocalDate(new Date()) },
            }}
            error={!!errors.date}
            helperText={errors.date}
            fullWidth
          />

          {loading
            ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )
            : errors.slots
            ? <Alert severity='error'>{errors.slots}</Alert>
            : availableSlots.length === 0
            ? (
              <Alert severity='info'>
                {selectedDentist && selectedDate
                  ? 'No available time slots found for the selected date and dentist.'
                  : 'Please select a dentist and date to view available time slots.'}
              </Alert>
            )
            : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableSlots.map((slot) => (
                  <Chip
                    key={`${slot.startTime}-${slot.endTime}`}
                    label={formatTime(slot.startTime)}
                    clickable
                    color={selectedTime === slot.startTime ? 'primary' : 'default'}
                    variant={selectedTime === slot.startTime ? 'filled' : 'outlined'}
                    onClick={() => onSelectTime(slot.startTime, slot.endTime)}
                  />
                ))}
              </Box>
            )}

          {errors.startTime && (
            <Alert severity='error'>
              {errors.startTime}
            </Alert>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DateTimeSelectionStep;
export type { AvailableSlot, DateTimeSelectionStepProps, ValidationErrors };
