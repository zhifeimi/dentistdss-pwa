/**
 * AppointmentCalendar types
 * Extracted to follow Single Responsibility Principle
 */

import type { Appointment as ApiAppointment } from '../../../../types/api';
import type { UserRole as CommonUserRole } from '../../../../types/common';

// Re-export the API types for use in this module
export type Appointment = ApiAppointment;
export type UserRole = CommonUserRole;

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
  status: string;
}

export interface SlotInfo {
  start: Date;
  end: Date;
  slots: Date[];
  action: 'select' | 'click' | 'doubleClick';
}

export interface NewAppointmentData {
  date: string;
  startTime: string;
  endTime: string;
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'work_week';

export interface AppointmentCalendarProps {
  /** Array of appointment objects */
  appointments?: Appointment[];
  /** User role for event display customization */
  userRole: UserRole;
  /** Callback when an event is selected */
  onSelectEvent?: (appointment: Appointment) => void;
  /** Callback when a time slot is selected */
  onSelectSlot?: (slotInfo: SlotInfo) => void;
  /** Callback for creating new appointment */
  onNewAppointment?: (data?: NewAppointmentData) => void;
  /** Currently selected date */
  selectedDate?: Date;
  /** Current calendar view */
  view?: CalendarView;
  /** Callback when view changes */
  onViewChange?: (view: CalendarView) => void;
  /** Callback when date navigation occurs */
  onNavigate?: (date: Date) => void;
  /** Whether to show the add appointment button */
  showAddButton?: boolean;
  /** Calendar height in pixels */
  height?: number;
}

export interface EventComponentProps {
  event: CalendarEvent;
}
