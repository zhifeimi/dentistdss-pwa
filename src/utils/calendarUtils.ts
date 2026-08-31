import dayjs from './dayjs';

/**
 * Utility functions for transforming availability data to calendar events
 */

interface AvailabilitySlot {
  id: string | number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string;
  isRecurring: boolean;
  dayOfWeek: number;
  isBlocked: boolean;
  isActive: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AvailabilitySlot & {
    eventDate: string;
    isRecurringInstance: boolean;
  };
  backgroundColor: string;
  borderColor: string;
  color: string;
}

interface EventColor {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

interface ViewRange {
  startDate: string;
  endDate: string;
  startDateTime: Date;
  endDateTime: Date;
}

/**
 * Format time string for display
 */
export const formatTimeForDisplay = (timeString: string): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Create a Date object from date string and time string
 */
export const createDateTime = (dateString: string, timeString: string): Date => {
  const [hours, minutes, seconds = '00'] = timeString.split(':');
  const date = new Date(dateString + 'T00:00:00');
  date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
  return date;
};

/**
 * Generate dates for recurring slots within a date range
 */
export const generateRecurringDates = (slot: AvailabilitySlot, startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const effectiveFrom = new Date(slot.effectiveFrom);
  const effectiveUntil = new Date(slot.effectiveUntil);

  // Start from the later of startDate or effectiveFrom
  const iterStart = new Date(Math.max(startDate.getTime(), effectiveFrom.getTime()));
  // End at the earlier of endDate or effectiveUntil
  const iterEnd = new Date(Math.min(endDate.getTime(), effectiveUntil.getTime()));

  const current = new Date(iterStart);
  current.setHours(0, 0, 0, 0);

  while (current <= iterEnd) {
    if (current.getDay() === slot.dayOfWeek) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Get event color based on slot status
 */
export const getEventColor = (slot: AvailabilitySlot): EventColor => {
  if (slot.isBlocked) {
    return {
      backgroundColor: '#f44336', // Red
      borderColor: '#d32f2f',
      color: '#ffffff'
    };
  }
  
  if (slot.isActive) {
    return {
      backgroundColor: '#4caf50', // Green
      borderColor: '#388e3c',
      color: '#ffffff'
    };
  }
  
  return {
    backgroundColor: '#9e9e9e', // Gray
    borderColor: '#757575',
    color: '#ffffff'
  };
};

/**
 * Transform availability slots into calendar events
 */
export const transformSlotsToEvents = (availability: AvailabilitySlot[], viewStart: Date, viewEnd: Date): CalendarEvent[] => {
  if (!availability || !Array.isArray(availability)) {
    return [];
  }

  const events: CalendarEvent[] = [];

  availability.forEach(slot => {
    if (!slot || typeof slot !== 'object') {
      return;
    }

    try {
      if (slot.isRecurring) {
        // Generate events for recurring slots
        const dates = generateRecurringDates(slot, viewStart, viewEnd);
        
        dates.forEach(dateString => {
          const startDateTime = createDateTime(dateString, slot.startTime);
          const endDateTime = createDateTime(dateString, slot.endTime);
          
          const event = {
            id: `${slot.id}-${dateString}`,
            title: `${formatTimeForDisplay(slot.startTime)} - ${formatTimeForDisplay(slot.endTime)}`,
            start: startDateTime,
            end: endDateTime,
            resource: {
              ...slot,
              eventDate: dateString,
              isRecurringInstance: true
            },
            ...getEventColor(slot)
          };
          
          events.push(event);
        });
      } else {
        // One-time slot
        const eventDate = slot.effectiveFrom;
        const eventDateTime = new Date(eventDate);
        
        // Check if the one-time slot falls within the view range
        if (eventDateTime >= viewStart && eventDateTime <= viewEnd) {
          const startDateTime = createDateTime(eventDate, slot.startTime);
          const endDateTime = createDateTime(eventDate, slot.endTime);
          
          const event = {
            id: `${slot.id}-${eventDate}`,
            title: `${formatTimeForDisplay(slot.startTime)} - ${formatTimeForDisplay(slot.endTime)}`,
            start: startDateTime,
            end: endDateTime,
            resource: {
              ...slot,
              eventDate: eventDate,
              isRecurringInstance: false
            },
            ...getEventColor(slot)
          };
          
          events.push(event);
        }
      }
    } catch (error) {
      console.error('Error transforming slot to event:', slot, error);
    }
  });

  return events;
};

/**
 * Get calendar view range for data loading
 */
export const getCalendarViewRange = (currentDate: Date, view: string = 'month'): ViewRange => {
  const start = dayjs(currentDate);
  const end = dayjs(currentDate);

  switch (view) {
    case 'month':
      start.startOf('month').subtract(7, 'days'); // Include previous week for month view
      end.endOf('month').add(7, 'days'); // Include next week for month view
      break;
    case 'week':
      start.startOf('week');
      end.endOf('week');
      break;
    case 'day':
      start.startOf('day');
      end.endOf('day');
      break;
    default:
      start.startOf('month');
      end.endOf('month');
  }
  
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    startDateTime: start.toDate(),
    endDateTime: end.toDate()
  };
};

/**
 * Create event style getter for react-big-calendar
 */
export const createEventStyleGetter = () => {
  return (event: CalendarEvent) => {
    const backgroundColor = event.backgroundColor || '#3174ad';
    const borderColor = event.borderColor || '#3174ad';
    const color = event.color || '#ffffff';

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };
};

export default {
  formatTimeForDisplay,
  createDateTime,
  generateRecurringDates,
  getEventColor,
  transformSlotsToEvents,
  getCalendarViewRange,
  createEventStyleGetter
};
