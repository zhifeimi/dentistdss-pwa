/**
 * BookingWizard types
 * Extracted to follow Single Responsibility Principle
 */

import type {
  Clinic as ApiClinic,
  Dentist,
  TimeSlot,
} from '../../../../types/api';

export interface BookingData {
  clinicId: string;
  dentistId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  reason: string;
  symptoms: string;
  urgency: string;
  notes: string;
}

export interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

// Re-export the API Clinic type for use in this module
export type Clinic = ApiClinic;

export interface ServiceType {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface AvailableSlot extends TimeSlot {
  id: string;
}

export interface BookingWizardProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Current step index */
  currentStep: number;
  /** Booking form data */
  bookingData: BookingData;
  /** Patient form data */
  patientData: PatientData;
  /** Form validation errors */
  errors: ValidationErrors;
  /** Available clinics */
  clinics: Clinic[];
  /** Dentists loaded for the selected clinic */
  dentists: Dentist[];
  /** Available time slots */
  availableSlots: AvailableSlot[];
  /** Available service types */
  serviceTypes: ServiceType[];
  /** Loading state */
  loading: boolean;
  /** Callback to update booking data */
  onUpdateBookingData: (field: keyof BookingData, value: string) => void;
  /** Callback to update patient data */
  onUpdatePatientData: (field: keyof PatientData, value: string) => void;
  /** Callback to go to next step */
  onNextStep: () => void;
  /** Callback to go to previous step */
  onPreviousStep: () => void;
  /** Callback to submit booking */
  onSubmitBooking: () => Promise<any>;
  /** Callback when booking is completed */
  onBookingComplete?: (result: any) => void;
  /** User role */
  userRole?: string;
  /** Whether user is logged in */
  isLoggedIn?: boolean;
}

export interface WizardAppBarProps {
  onClose: () => void;
  onPreviousStep: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  loading: boolean;
}

export interface WizardStepperProps {
  currentStep: number;
  steps: string[];
  isMobile: boolean;
}

export interface WizardContentProps {
  currentStep: number;
  bookingData: BookingData;
  patientData: PatientData;
  errors: ValidationErrors;
  clinics: Clinic[];
  dentists: Dentist[];
  availableSlots: AvailableSlot[];
  serviceTypes: ServiceType[];
  loading: boolean;
  isLoggedIn: boolean;
  onUpdateBookingData: (field: keyof BookingData, value: string) => void;
  onUpdatePatientData: (field: keyof PatientData, value: string) => void;
}
