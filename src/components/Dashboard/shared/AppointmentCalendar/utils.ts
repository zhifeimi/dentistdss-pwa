import dayjs from '../../../../utils/dayjs';
import type { Appointment, CalendarEvent, UserRole, CalendarView } from './types';

/**
 * AppointmentCalendar utility functions
 * Extracted to follow Single Responsibility Principle
 */

/**
 * Parse appointment date and time into a proper Date object
 * Handles timezone issues by creating dates in local timezone
 */
export const parseAppointmentDateTime = (dateStr: string, timeStr: string): Date => {
  if (!dateStr || !timeStr) {
    console.warn('Invalid date or time provided:', { dateStr, timeStr });
    return new Date();
  }

  // Parse date components (YYYY-MM-DD)
  const [year, month, day] = dateStr.split('-').map(Number);

  // Parse time components (HH:mm:ss or HH:mm)
  const timeParts = timeStr.split(':').map(Number);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;
  const seconds = timeParts[2] || 0;

  // Create date in local timezone to avoid timezone conversion issues
  const date = new Date(year, month - 1, day, hours, minutes, seconds);

  // Validate the created date
  if (isNaN(date.getTime())) {
    console.error('Invalid date created from:', { dateStr, timeStr });
    return new Date();
  }

  return date;
};

/**
 * Convert appointments to calendar events
 */
export const convertAppointmentsToEvents = (
  appointments: Appointment[],
  userRole: UserRole
): CalendarEvent[] => {
  return appointments.map(appointment => {
    // Handle both old and new API data structures
    const appointmentDate = appointment.appointmentDate || appointment.date;
    const serviceName = appointment.serviceName || appointment.serviceType || appointment.serviceId;
    const dentistName = appointment.dentistName;
    const patientName = appointment.patientName;

    // Parse date and time more reliably to avoid timezone issues
    const startDateTime = parseAppointmentDateTime(appointmentDate || '', appointment.startTime);
    const endDateTime = parseAppointmentDateTime(appointmentDate || '', appointment.endTime);

    // Determine title based on user role
    const title = getTitleByRole(userRole, String(serviceName), dentistName, patientName);

    return {
      id: String(appointment.id), // Convert to string for CalendarEvent
      title,
      start: startDateTime,
      end: endDateTime,
      resource: appointment,
      status: appointment.status,
    };
  });
};

/**
 * Get event title based on user role
 */
export const getTitleByRole = (
  userRole: UserRole,
  serviceName?: string,
  dentistName?: string,
  patientName?: string
): string => {
  switch (userRole) {
    case 'PATIENT':
      return `${serviceName || 'Appointment'} - Dr. ${dentistName || 'Unknown'}`;
    case 'DENTIST':
      return `${patientName || 'Unknown Patient'} - ${serviceName || 'Appointment'}`;
    case 'RECEPTIONIST':
    case 'CLINIC_ADMIN':
      return `${patientName || 'Unknown'} with Dr. ${dentistName || 'Unknown'}`;
    default:
      return serviceName || 'Appointment';
  }
};

/**
 * Get responsive calendar views
 */
export const getCalendarViews = (isMobile: boolean): CalendarView[] => {
  return isMobile ? ['day', 'agenda'] : ['month', 'week', 'day', 'agenda'];
};

/**
 * Get default calendar view
 */
export const getDefaultView = (isMobile: boolean, view: CalendarView): CalendarView => {
  return isMobile ? 'day' : view;
};

/**
 * Calendar messages for localization
 */
export const getCalendarMessages = () => ({
  allDay: 'All Day',
  previous: 'Previous',
  next: 'Next',
  today: 'Today',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Time',
  event: 'Appointment',
  noEventsInRange: 'No appointments in this range.',
  showMore: (total: number) => `+${total} more`,
});

/**
 * Calendar formats configuration
 */
export const getCalendarFormats = (isMobile: boolean) => ({
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${dayjs(start).format('HH:mm')} - ${dayjs(end).format('HH:mm')}`,
  dayHeaderFormat: isMobile ? 'ddd M/D' : 'dddd, MMMM D',
  monthHeaderFormat: 'MMMM YYYY',
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${dayjs(start).format('MMM D')} - ${dayjs(end).format('MMM D, YYYY')}`,
});

/**
 * Calendar time constraints
 */
export const CALENDAR_CONSTRAINTS = {
  MIN_TIME: new Date(2024, 0, 1, 8, 0), // 8:00 AM
  MAX_TIME: new Date(2024, 0, 1, 18, 0), // 6:00 PM
  STEP: 15,
  TIMESLOTS: 4,
} as const;
