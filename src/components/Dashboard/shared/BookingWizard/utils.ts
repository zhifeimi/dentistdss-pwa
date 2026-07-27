/**
 * BookingWizard utility functions
 * Extracted to follow Single Responsibility Principle
 */

/**
 * Appointment booking is authenticated-only, so patient-profile creation is
 * not part of the wizard.
 */
export const getWizardSteps = (_isLoggedIn: boolean): string[] => [
  'Select Clinic',
  'Service Details',
  'Choose Date & Time',
  'Confirmation',
];

/**
 * Service selection precedes slot selection so the authoritative slot request
 * includes the persisted service duration. The content switch retains its
 * historical component indices and unsupported patient-information step.
 */
export const adjustStepIndex = (
  step: number,
  _isLoggedIn: boolean,
): number => [0, 2, 1, 4][step] ?? step;

export const isLastStep = (
  currentStep: number,
  totalSteps: number,
): boolean => currentStep === totalSteps - 1;

export const isFirstStep = (currentStep: number): boolean => currentStep === 0;

export const getNextButtonText = (
  isLast: boolean,
  loading: boolean,
): string => {
  if (loading) return 'Processing...';
  return isLast ? 'Book Appointment' : 'Next';
};
