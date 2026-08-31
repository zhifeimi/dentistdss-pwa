import dayjs, { type Dayjs } from '../../../../utils/dayjs';
import type { AvailabilitySlot, CalendarEvent } from './types';

/**
 * CalendarTimeSlotPicker utility functions
 * Extracted to follow Single Responsibility Principle
 */

/**
 * Generate date range for availability loading
 */
export const getDateRange = (navigationDate?: Date | null) => {
  const baseDate = navigationDate ? dayjs(navigationDate) : dayjs('2025-06-01');
  const startDate = baseDate.startOf('month').format('YYYY-MM-DD');
  const endDate = baseDate.add(3, 'months').endOf('month').format('YYYY-MM-DD');

  return { startDate, endDate };
};

/**
 * Validate availability slot
 */
export const isValidSlot = (slot: AvailabilitySlot): boolean => {
  return slot.isActive && !slot.isBlocked && slot.startTime !== "00:00:00";
};

/**
 * Validate time range
 */
export const isValidTimeRange = (startTime: Dayjs, endTime: Dayjs): boolean => {
  return startTime.isValid() && endTime.isValid() && startTime.isBefore(endTime);
};

/**
 * Convert availability data to calendar events
 */
export const convertToCalendarEvents = (availability: AvailabilitySlot[]): CalendarEvent[] => {
  if (!availability.length) return [];

  const calendarEvents: CalendarEvent[] = [];

  availability.forEach(slot => {
    if (!isValidSlot(slot)) {
      console.log('Skipping slot:', slot.id, 'isActive:', slot.isActive, 'isBlocked:', slot.isBlocked, 'startTime:', slot.startTime);
      return;
    }

    const slotDate = slot.effectiveFrom;
    console.log('Processing slot:', slot.id, 'date:', slotDate, 'time:', slot.startTime, '-', slot.endTime);

    // Generate 30-minute time slots for each availability period
    const startTime = dayjs(`${slotDate} ${slot.startTime}`, 'YYYY-MM-DD HH:mm:ss');
    const endTime = dayjs(`${slotDate} ${slot.endTime}`, 'YYYY-MM-DD HH:mm:ss');

    if (!isValidTimeRange(startTime, endTime)) {
      console.warn('Invalid time range for slot:', slot);
      return;
    }

    let current = startTime;
    while (current.isBefore(endTime)) {
      const slotEnd = current.add(30, 'minutes');

      // Don't create slots that extend beyond the availability period
      if (slotEnd.isAfter(endTime)) break;

      calendarEvents.push({
        id: `${slot.id}-${current.format('HHmm')}`,
        title: current.format('HH:mm'),
        start: current.toDate(),
        end: slotEnd.toDate(),
        resource: {
          id: slot.id,
          dentistId: slot.dentistId,
          date: slotDate,
          slotStart: current.format('HH:mm:ss'),
          slotEnd: slotEnd.format('HH:mm:ss'),
          isAvailable: true,
        }
      });

      current = current.add(30, 'minutes');
    }
  });

  console.log('Generated calendar events:', calendarEvents.length, calendarEvents);
  return calendarEvents;
};

/**
 * Format selected time for display
 */
export const formatSelectedTime = (selectedTime: string): string => {
  return dayjs(selectedTime, 'HH:mm:ss').format('h:mm A');
};

/**
 * Calendar configuration constants
 */
export const CALENDAR_CONFIG = {
  SLOT_DURATION: 30, // minutes
  MIN_HOUR: 8, // 8:00 AM
  MAX_HOUR: 18, // 6:00 PM
  DEFAULT_DATE: new Date(2025, 5, 1), // June 2025
  VIEWS: ['month', 'week', 'day'],
  STEP: 30,
  TIMESLOTS: 2,
} as const;
