/**
 * Schedule utility functions
 * Extracted to follow Single Responsibility Principle
 */

export interface AvailabilitySlot {
  id: string | number;
  dentistId: string | number;
  clinicId?: string | number;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveUntil: string;
  isBlocked: boolean;
  isActive: boolean;
  blockReason?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CalendarRange {
  startDateTime: Date;
  endDateTime: Date;
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get date range for current month view
 */
export const getDateRange = (date: Date): DateRange => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: formatDate(startOfMonth),
    endDate: formatDate(endOfMonth)
  };
};

/**
 * Get availability slots for a specific date
 */
export const getSlotsForDate = (
  availability: AvailabilitySlot[], 
  date: Date
): AvailabilitySlot[] => {
  const dateStr = formatDate(date);
  const dateDayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  if (!availability || availability.length === 0) {
    return [];
  }

  const filteredSlots = availability.filter(slot => {
    // Validate slot data and ensure dayOfWeek is consistently 0-6
    if (!slot || typeof slot !== 'object' || typeof slot.dayOfWeek !== 'number' || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      // If dayOfWeek is 7 (ISO Sunday), convert to 0 for consistency
      if (slot?.dayOfWeek === 7) {
        slot.dayOfWeek = 0;
      } else {
        return false;
      }
    }

    if (slot.isRecurring) {
      // For recurring slots, check if the date falls within the effective range
      // and matches the day of week
      const slotDayOfWeek = slot.dayOfWeek;

      // Parse dates safely and consistently
      let effectiveFrom: Date, effectiveUntil: Date;
      try {
        effectiveFrom = new Date(slot.effectiveFrom.split('T')[0] + 'T00:00:00');
        effectiveUntil = new Date(slot.effectiveUntil.split('T')[0] + 'T23:59:59');
      } catch (error) {
        console.error('❌ Date parsing error for slot:', slot, error);
        return false;
      }

      // Normalize the target date to start of day for comparison
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const dayMatches = slotDayOfWeek === dateDayOfWeek;
      const dateInRange = targetDate >= effectiveFrom && targetDate <= effectiveUntil;

      return dayMatches && dateInRange;
    } else {
      // For one-time slots, check exact date match
      return slot.effectiveFrom === dateStr;
    }
  });

  return filteredSlots;
};

/**
 * Validate slot data structure
 */
const validateSlot = (slot: any): slot is AvailabilitySlot => {
  return (
    slot &&
    typeof slot === 'object' &&
    (typeof slot.id === 'string' || typeof slot.id === 'number') &&
    (typeof slot.dentistId === 'string' || typeof slot.dentistId === 'number') &&
    (typeof slot.clinicId === 'string' || typeof slot.clinicId === 'number') &&
    typeof slot.dayOfWeek === 'number' &&
    slot.dayOfWeek >= 0 &&
    slot.dayOfWeek <= 6 &&
    typeof slot.startTime === 'string' &&
    typeof slot.endTime === 'string' &&
    typeof slot.isRecurring === 'boolean' &&
    typeof slot.effectiveFrom === 'string' &&
    typeof slot.effectiveUntil === 'string'
  );
};

/**
 * Normalize API response data
 */
export const normalizeAvailabilityData = (data: any): AvailabilitySlot[] => {
  const rawData = Array.isArray(data) ? data : data?.dataObject || data?.data || [];
  return rawData.filter(validateSlot);
};
