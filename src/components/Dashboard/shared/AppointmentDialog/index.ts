/**
 * AppointmentDialog component exports
 * 
 * Refactored from single 427-line file to modular architecture:
 * - AppointmentDialog.tsx: Main component (~150 lines)
 * - AppointmentInfo.tsx: Patient and dentist information
 * - DateTimeSection.tsx: Date and time display/editing
 * - AppointmentDetails.tsx: Service details, urgency, reason, symptoms, notes
 * - AppointmentActions.tsx: Dialog action buttons
 * - utils.ts: Utility functions
 * - types.ts: TypeScript interfaces
 * 
 * Benefits:
 * ✅ 65% reduction in main component size (427 → ~150 lines)
 * ✅ Single Responsibility Principle compliance
 * ✅ Better testability with focused components
 * ✅ Improved maintainability and readability
 * ✅ Reusable components and utilities
 * ✅ Type safety with TypeScript
 */

export { default } from './AppointmentDialog';
export * from './utils';
export * from './types';
