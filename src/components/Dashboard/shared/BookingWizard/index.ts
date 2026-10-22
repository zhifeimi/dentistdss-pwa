/**
 * BookingWizard component exports
 * 
 * Refactored from single 314-line file to modular architecture:
 * - BookingWizard.tsx: Main component (~100 lines)
 * - WizardAppBar.tsx: App bar with navigation controls
 * - WizardStepper.tsx: Progress stepper component
 * - WizardContent.tsx: Step content renderer
 * - utils.ts: Utility functions
 * - types.ts: TypeScript interfaces
 * 
 * Benefits:
 * ✅ 68% reduction in main component size (314 → ~100 lines)
 * ✅ Single Responsibility Principle compliance
 * ✅ Better testability with focused components
 * ✅ Improved maintainability and readability
 * ✅ Reusable components and utilities
 * ✅ Type safety with TypeScript
 */

export { default } from './BookingWizard';
export * from './utils';
export * from './types';
