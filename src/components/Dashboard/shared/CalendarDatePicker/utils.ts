import dayjs, { type Dayjs } from '../../../../utils/dayjs';

/**
 * CalendarDatePicker utility functions
 * Extracted to follow Single Responsibility Principle
 */

/**
 * Format date for display
 */
export const formatDate = (date?: Date | null): string => {
  if (!date) return '';
  return dayjs(date).format('MMM D, YYYY');
};

/**
 * Check if date is selectable based on constraints
 */
export const isDateSelectable = (
  date: Date,
  minDate?: Date | null,
  maxDate?: Date | null
): boolean => {
  const dayjsDate = dayjs(date);
  if (minDate && dayjsDate.isBefore(dayjs(minDate), 'day')) return false;
  if (maxDate && dayjsDate.isAfter(dayjs(maxDate), 'day')) return false;
  return true;
};

/**
 * Check if date is selected
 */
export const isDateSelected = (date: Date, value?: Date | null): boolean => {
  if (!value) return false;
  return dayjs(date).isSame(dayjs(value), 'day');
};

/**
 * Generate calendar days for a given month
 */
export const generateCalendarDays = (calendarDate: Dayjs): Dayjs[] => {
  const startOfMonth = calendarDate.startOf('month');
  const endOfMonth = calendarDate.endOf('month');
  const startOfCalendar = startOfMonth.startOf('week');
  const endOfCalendar = endOfMonth.endOf('week');

  const days: Dayjs[] = [];
  let current = startOfCalendar;

  while (current.isSameOrBefore(endOfCalendar, 'day')) {
    days.push(current);
    current = current.add(1, 'day');
  }

  return days;
};

/**
 * Get initial calendar date
 */
export const getInitialCalendarDate = (
  value?: Date | null,
  minDate?: Date | null
): Dayjs => {
  if (value) return dayjs(value);
  if (minDate && dayjs().isBefore(dayjs(minDate))) return dayjs(minDate);
  return dayjs();
};

/**
 * Validate and handle date selection
 */
export const handleDateSelection = (
  date: Date,
  minDate?: Date | null,
  maxDate?: Date | null,
  onChange?: (date: Date | null) => void
): boolean => {
  if (!isDateSelectable(date, minDate, maxDate)) return false;
  
  onChange?.(date);
  return true;
};

/**
 * Week day labels
 */
export const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
