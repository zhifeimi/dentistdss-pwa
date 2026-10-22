import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/auth';
import { getCalendarViewRange, transformSlotsToEvents } from '../utils/calendarUtils';
import {
  AvailabilitySlot,
  CalendarEvent,
  CalendarRange,
  CalendarView,
  formatDate,
  getDateRange,
  getSlotsForDate,
  normalizeAvailabilityData,
} from './schedule/scheduleUtils';
import {
  loadAvailabilityData,
  createAvailabilitySlot,
  blockAvailabilitySlot,
  unblockAvailabilitySlot,
  deleteAvailabilitySlot,
} from './schedule/scheduleApi';

interface UseScheduleReturn {
  // State
  availability: AvailabilitySlot[];
  loading: boolean;
  error: string;
  selectedDate: Date;
  calendarView: CalendarView;
  calendarEvents: CalendarEvent[];

  // Actions
  createAvailability: (availabilityData: Partial<AvailabilitySlot>) => Promise<AvailabilitySlot>;
  blockSlot: (slotId: string | number, reason: string) => Promise<void>;
  unblockSlot: (slotId: string | number) => Promise<void>;
  deleteSlot: (slotId: string | number) => Promise<void>;
  refreshAvailability: () => void;
  changeSelectedDate: (newDate: Date) => void;
  setCalendarView: (view: CalendarView) => void;

  // Computed values
  getSlotsForDate: (date: Date) => AvailabilitySlot[];
  getCalendarRange: (date: Date, view?: CalendarView) => CalendarRange;
  transformToCalendarEvents: (availabilityData: AvailabilitySlot[], viewStart: Date, viewEnd: Date) => CalendarEvent[];

  // Utilities
  formatDate: (date: Date) => string;
}

/**
 * Custom hook for schedule management
 * Provides state management and API interactions for dentist availability
 */
const useSchedule = (): UseScheduleReturn => {
  const { currentUser } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  /**
   * Get calendar view range for data loading
   */
  const getCalendarRange = useCallback((date: Date, view: CalendarView = 'month'): CalendarRange => {
    return getCalendarViewRange(date, view);
  }, []);

  /**
   * Transform availability data to calendar events
   */
  const transformToCalendarEvents = useCallback((
    availabilityData: AvailabilitySlot[],
    viewStart: Date,
    viewEnd: Date
  ): CalendarEvent[] => {
    return transformSlotsToEvents(availabilityData, viewStart, viewEnd);
  }, []);

  /**
   * Load availability data for date range
   */
  const loadAvailability = useCallback(async (startDate: string, endDate: string): Promise<void> => {
    if (!currentUser?.id || !currentUser?.clinicId) {
      setError('User information not available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loadAvailabilityData(currentUser!, startDate, endDate);
      setAvailability(normalizeAvailabilityData(data));
    } catch (err: any) {
      console.error('❌ Failed to load availability:', err);
      setError(err.message || 'Failed to load availability data');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Load availability for current selected date range
   */
  const refreshAvailability = useCallback((): void => {
    const { startDate, endDate } = getDateRange(selectedDate);
    loadAvailability(startDate, endDate);
  }, [selectedDate, getDateRange, loadAvailability]);

  /**
   * Create new availability slot
   */
  const createAvailability = useCallback(async (availabilityData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot> => {
    setLoading(true);
    try {
      const newSlot = await createAvailabilitySlot(currentUser!, availabilityData);
      refreshAvailability();
      return newSlot;
    } catch (err: any) {
      console.error('Failed to create availability:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, refreshAvailability]);

  /**
   * Block availability slot
   */
  const blockSlot = useCallback(async (slotId: string | number, reason: string): Promise<void> => {
    setLoading(true);
    try {
      await blockAvailabilitySlot(slotId, reason);
      refreshAvailability();
    } catch (err: any) {
      console.error('Failed to block slot:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshAvailability]);

  /**
   * Unblock availability slot
   */
  const unblockSlot = useCallback(async (slotId: string | number): Promise<void> => {
    setLoading(true);
    try {
      await unblockAvailabilitySlot(slotId);
      refreshAvailability();
    } catch (err: any) {
      console.error('Failed to unblock slot:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshAvailability]);

  /**
   * Delete availability slot
   */
  const deleteSlot = useCallback(async (slotId: string | number): Promise<void> => {
    setLoading(true);
    try {
      await deleteAvailabilitySlot(slotId);
      refreshAvailability();
    } catch (err: any) {
      console.error('Failed to delete slot:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshAvailability]);

  /**
   * Get availability slots for a specific date (using utility function)
   */
  const getSlots = useCallback((date: Date): AvailabilitySlot[] => {
    return getSlotsForDate(availability, date);
  }, [availability]);

  /**
   * Change selected date and load new data if needed
   */
  const changeSelectedDate = useCallback((newDate: Date): void => {
    const currentRange = getDateRange(selectedDate);
    const newRange = getDateRange(newDate);

    setSelectedDate(newDate);

    // Load new data if the month changed
    if (currentRange.startDate !== newRange.startDate) {
      loadAvailability(newRange.startDate, newRange.endDate);
    }
  }, [selectedDate, getDateRange, loadAvailability]);

  // Update calendar events when availability data changes
  useEffect(() => {
    if (availability.length > 0) {
      const { startDateTime, endDateTime } = getCalendarRange(selectedDate, calendarView);
      const events = transformToCalendarEvents(availability, startDateTime, endDateTime);
      setCalendarEvents(events);
    } else {
      setCalendarEvents([]);
    }
  }, [availability, selectedDate, calendarView, getCalendarRange, transformToCalendarEvents]);

  // Load initial data when component mounts or user changes
  useEffect(() => {
    if (currentUser?.id && currentUser?.clinicId) {
      const { startDate, endDate } = getDateRange(selectedDate);
      loadAvailability(startDate, endDate);
    }
  }, [currentUser?.id, currentUser?.clinicId, selectedDate, getDateRange, loadAvailability]);

  return {
    // State
    availability,
    loading,
    error,
    selectedDate,
    calendarView,
    calendarEvents,

    // Actions
    createAvailability,
    blockSlot,
    unblockSlot,
    deleteSlot,
    refreshAvailability,
    changeSelectedDate,
    setCalendarView,

    // Computed values
    getSlotsForDate: getSlots,
    getCalendarRange,
    transformToCalendarEvents,

    // Utilities
    formatDate
  };
};

export default useSchedule;
