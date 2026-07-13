import React, { useState, useCallback, memo } from 'react';
import {
  Box,
  TextField,
  Popover,
  Paper,
  Typography,
  Grid,
  Button,
  useTheme,
  TextFieldProps,
} from '@mui/material';
import moment from 'moment';

interface TimeSlot {
  value: string;
  display: string;
  hour: number;
  minute: number;
}

interface TimeSelectorProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  /** Field label */
  label?: string;
  /** Selected time value in HH:mm:ss format */
  value?: string;
  /** Callback when time changes */
  onChange: (time: string) => void;
  /** Minimum selectable time in HH:mm:ss format */
  minTime?: string;
  /** Maximum selectable time in HH:mm:ss format */
  maxTime?: string;
  /** Error state */
  error?: boolean;
  /** Helper text */
  helperText?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * TimeSelector - Custom time picker component
 *
 * Features:
 * - Uses moment.js for consistency with react-big-calendar
 * - Material-UI design integration
 * - 15-minute intervals for appointment scheduling
 * - Business hours focus (8 AM - 6 PM)
 */
const TimeSelector: React.FC<TimeSelectorProps> = memo(({
  label,
  value,
  onChange,
  minTime,
  maxTime,
  error = false,
  helperText = '',
  required = false,
  disabled = false,
  fullWidth = false,
  placeholder = 'Select time',
  ...textFieldProps
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  const open = Boolean(anchorEl);

  // Generate time slots (15-minute intervals)
  const generateTimeSlots = useCallback((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = minTime ? moment(minTime, 'HH:mm:ss').hour() : 8;
    const endHour = maxTime ? moment(maxTime, 'HH:mm:ss').hour() : 18;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Don't include the last slot if it's exactly at the end hour
        if (hour === endHour && minute > 0) break;

        const timeString = moment().hour(hour).minute(minute).format('HH:mm:ss');
        const displayString = moment().hour(hour).minute(minute).format('h:mm A');

        slots.push({
          value: timeString,
          display: displayString,
          hour,
          minute,
        });
      }
    }

    return slots;
  }, [minTime, maxTime]);

  // Format time for display
  const formatTime = useCallback((timeString?: string): string => {
    if (!timeString) return '';
    return moment(timeString, 'HH:mm:ss').format('h:mm A');
  }, []);

  // Handle text field click
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  }, [disabled]);

  // Handle popover close
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Handle time selection
  const handleTimeSelect = useCallback((timeString: string) => {
    onChange(timeString);
    handleClose();
  }, [onChange, handleClose]);

  const timeSlots = generateTimeSlots();

  // Group time slots by hour for better organization
  const groupedSlots = timeSlots.reduce((groups: Record<number, TimeSlot[]>, slot) => {
    const hourKey = slot.hour;
    if (!groups[hourKey]) {
      groups[hourKey] = [];
    }
    groups[hourKey].push(slot);
    return groups;
  }, {});

  return (
    <>
      <TextField
        {...textFieldProps}
        label={label}
        value={formatTime(value)}
        onClick={handleClick}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        placeholder={placeholder}
        slotProps={{
          input: {
            readOnly: true,
            style: { cursor: disabled ? 'default' : 'pointer' },
          },
        }}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ p: 2, maxWidth: 300, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
            Select Time
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(groupedSlots).map(([hour, slots]) => (
              <Box key={hour}>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ mb: 1, fontWeight: 'medium' }}
                >
                  {moment().hour(parseInt(hour)).format('h A')}
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {slots.map((slot) => (
                    <Grid size={{ xs: 6 }} key={slot.value}>
                      <Button
                        size="small"
                        variant={value === slot.value ? 'contained' : 'outlined'}
                        onClick={() => handleTimeSelect(slot.value)}
                        sx={{
                          width: '100%',
                          fontSize: '0.75rem',
                          py: 0.5,
                          minHeight: 32,
                        }}
                      >
                        {slot.display}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>

          {/* Footer */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            mt: 2,
            pt: 1,
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Button
              size="small"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
});

TimeSelector.displayName = 'TimeSelector';

export default TimeSelector;
export type { TimeSelectorProps, TimeSlot };
