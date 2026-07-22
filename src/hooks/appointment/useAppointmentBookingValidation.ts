import type { BookingData, BookingErrors, PatientData } from './useAppointmentBooking';

/**
 * Validation utilities for appointment booking
 * Extracted to follow Single Responsibility Principle
 */

export interface ValidationContext {
  currentUser: any;
  bookingData: BookingData;
  patientData: PatientData;
}

/**
 * Validate clinic selection step
 */
export const validateClinicSelection = (bookingData: BookingData): BookingErrors => {
  const errors: BookingErrors = {};

  if (!bookingData.clinicId) {
    errors.clinicId = 'Please select a clinic';
  }

  return errors;
};

/**
 * Validate time and dentist selection step
 */
export const validateTimeSelection = (bookingData: BookingData): BookingErrors => {
  const errors: BookingErrors = {};

  if (!bookingData.startTime) {
    errors.startTime = 'Please select a time slot';
  }
  if (!bookingData.endTime) {
    errors.endTime = 'End time is required';
  }
  if (!bookingData.date) {
    errors.date = 'Date is required';
  }
  if (!bookingData.dentistId) {
    errors.dentistId = 'Please select a dentist';
  }

  return errors;
};

/**
 * Validate service details step
 */
export const validateServiceDetails = (bookingData: BookingData): BookingErrors => {
  const errors: BookingErrors = {};

  if (!bookingData.serviceType) {
    errors.serviceType = 'Please select a service type';
  }
  if (!bookingData.reason.trim()) {
    errors.reason = 'Please provide a reason for the appointment';
  }

  return errors;
};

/**
 * Validate patient information step
 */
export const validatePatientInfo = (patientData: PatientData, currentUser: any): BookingErrors => {
  const errors: BookingErrors = {};

  // Only validate if user is not logged in
  if (!currentUser) {
    if (!patientData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!patientData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!patientData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(patientData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!patientData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
  }

  return errors;
};

/**
 * Main validation function that delegates to step-specific validators
 */
export const validateBookingStep = (
  step: number,
  context: ValidationContext,
): BookingErrors => {
  const { currentUser, bookingData, patientData } = context;

  switch (step) {
    case 0:
      return validateClinicSelection(bookingData);
    case 1:
      return validateServiceDetails(bookingData);
    case 2:
      return validateTimeSelection(bookingData);
    case 3:
      return validatePatientInfo(patientData, currentUser);
    default:
      return {};
  }
};

/**
 * Validate appointment data before submission
 */
export const validateAppointmentData = (
  appointmentData: any,
): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = [
    'dentistId',
    'clinicId',
    'serviceId',
    'appointmentDate',
    'startTime',
    'endTime',
    'reasonForVisit',
  ];

  const missingFields = requiredFields.filter((field) => !appointmentData[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};
