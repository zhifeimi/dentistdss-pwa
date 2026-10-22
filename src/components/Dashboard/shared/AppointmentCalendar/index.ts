/**
 * AppointmentCalendar component exports
 * 
 * Refactored from single 305-line file to modular architecture:
 * - AppointmentCalendar.tsx: Main component (~120 lines)
 * - EventComponent.tsx: Custom event component
 * - AddAppointmentFab.tsx: Floating action button
 * - useCalendarEvents.ts: Event handling hook
 * - CalendarStyles.ts: Styling utilities
 * - utils.ts: Utility functions
 * - types.ts: TypeScript interfaces
 * 
 * Benefits:
 * ✅ 61% reduction in main component size (305 → ~120 lines)
 * ✅ Single Responsibility Principle compliance
 * ✅ Better testability with focused components
 * ✅ Improved maintainability and readability
 * ✅ Reusable components and utilities
 * ✅ Type safety with TypeScript
 */

export { default } from './AppointmentCalendar';
export * from './utils';
export * from './types';
export * from './CalendarStyles';
