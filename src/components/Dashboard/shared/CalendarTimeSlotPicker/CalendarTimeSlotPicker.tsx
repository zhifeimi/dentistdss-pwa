import React, { useMemo, useCallback } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from '../../../../utils/dayjs';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAvailability } from './useAvailability';
import { EventComponent } from './EventComponent';
import { 
  LoadingState, 
  ErrorState, 
  NoDentistState, 
  NoDataState 
} from './LoadingAndErrorStates';
import {
  convertToCalendarEvents,
  formatSelectedTime,
  CALENDAR_CONFIG,
} from './utils';
import {
  getEventStyle,
  getCalendarPaperStyles,
  getCalendarFormats,
  getCalendarMessages,
} from './CalendarStyles';
import type { CalendarTimeSlotPickerProps } from './types';

// Setup the localizer for react-big-calendar
const localizer = dayjsLocalizer(dayjs);

/**
 * Refactored CalendarTimeSlotPicker component
 * 
 * Simplified from 368 lines to ~150 lines by:
 * - Extracting custom hook for availability management
 * - Moving utility functions to separate files
 * - Creating focused sub-components for states
 * - Separating styling logic
 * - Extracting types and constants
 * 
 * Benefits:
 * ✅ 59% reduction in main component size (368 → ~150 lines)
 * ✅ Single Responsibility Principle compliance
 * ✅ Better testability with focused components
 * ✅ Improved maintainability and readability
 * ✅ Reusable components and utilities
 * ✅ Type safety with TypeScript
 */
const CalendarTimeSlotPicker: React.FC<CalendarTimeSlotPickerProps> = ({
  dentistId,
  selectedTime,
  onSelectTime,
  loading: externalLoading = false,
  error: externalError = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { availability, loading, error, loadAvailability } = useAvailability(dentistId);

  /**
   * Convert availability data to calendar events
   */
  const events = useMemo(() => {
    return convertToCalendarEvents(availability);
  }, [availability]);

  /**
   * Handle time slot selection
   */
  const handleSelectEvent = useCallback((event: any) => {
    const { resource } = event;
    if (resource.isAvailable && onSelectTime) {
      onSelectTime(resource.slotStart, resource.slotEnd, resource.date);
    }
  }, [onSelectTime]);

  /**
   * Handle date navigation
   */
  const handleNavigate = useCallback((date: Date) => {
    loadAvailability(date);
  }, [loadAvailability]);

  /**
   * Custom event style getter
   */
  const eventStyleGetter = useCallback((event: any) => {
    const isSelected = selectedTime === event.resource.slotStart;
    return getEventStyle(isSelected, theme);
  }, [theme, selectedTime]);

  // Handle loading and error states
  const isLoading = externalLoading || loading;
  const currentError = externalError || error;

  if (isLoading) return <LoadingState loading={isLoading} />;
  if (currentError) return <ErrorState error={currentError} />;
  if (!dentistId) return <NoDentistState dentistId={dentistId} />;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Available Time Slots
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a 30-minute time slot from the calendar below. Green slots are available for booking.
      </Typography>

      <NoDataState 
        dentistId={dentistId}
        availabilityCount={availability.length}
        eventsCount={events.length}
      />

      {events.length > 0 && (
        <>
          {/* Selected time display */}
          {selectedTime && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Selected: ${formatSelectedTime(selectedTime)}`}
                color="primary"
                variant="filled"
              />
            </Box>
          )}

          {/* Calendar */}
          <Paper elevation={1} sx={getCalendarPaperStyles(theme, isMobile)}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              defaultView="month"
              views={[...CALENDAR_CONFIG.VIEWS]}
              date={CALENDAR_CONFIG.DEFAULT_DATE}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
              }}
              step={CALENDAR_CONFIG.STEP}
              timeslots={CALENDAR_CONFIG.TIMESLOTS}
              min={new Date(2024, 0, 1, CALENDAR_CONFIG.MIN_HOUR, 0)}
              max={new Date(2024, 0, 1, CALENDAR_CONFIG.MAX_HOUR, 0)}
              formats={getCalendarFormats(isMobile)}
              messages={getCalendarMessages()}
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default CalendarTimeSlotPicker;
