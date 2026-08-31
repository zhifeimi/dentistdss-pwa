import { TextFieldProps } from '@mui/material';
import type { Dayjs } from '../../../../utils/dayjs';

/**
 * CalendarDatePicker types
 * Extracted to follow Single Responsibility Principle
 */

export interface CalendarDatePickerProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  /** Field label */
  label?: string;
  /** Selected date value */
  value?: Date | null;
  /** Callback when date changes */
  onChange: (date: Date | null) => void;
  /** Minimum selectable date */
  minDate?: Date | null;
  /** Maximum selectable date */
  maxDate?: Date | null;
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

export interface CalendarHeaderProps {
  calendarDate: Dayjs;
  onNavigateMonth: (direction: number) => void;
}

export interface CalendarGridProps {
  calendarDate: Dayjs;
  value?: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  onDateSelect: (date: Date) => void;
}

export interface CalendarFooterProps {
  onGoToToday: () => void;
  onClose: () => void;
  isTodaySelectable: boolean;
}
