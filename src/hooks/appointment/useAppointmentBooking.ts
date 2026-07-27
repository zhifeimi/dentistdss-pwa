import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/auth';
import useConfirmationDialog from '../dashboard/useConfirmationDialog';
import type { Appointment, Clinic, Dentist, TimeSlot } from '../../types/api';
import { useAppointmentBookingData } from './useAppointmentBookingData';
import { validateBookingStep } from './useAppointmentBookingValidation';
import { useBookingSubmission } from './useAppointmentBookingSubmission';

// Extract types to separate interfaces
export interface ServiceType {
  id: string;
  name: string;
  duration: number;
  serviceId: number;
  price: number;
}

export interface BookingData {
  clinicId: string;
  dentistId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  serviceDuration: number;
  reason: string;
  symptoms: string;
  urgency: 'low' | 'medium' | 'high';
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

export interface BookingErrors {
  [key: string]: string;
}

export interface UseAppointmentBookingReturn {
  // State
  currentStep: number;
  loading: boolean;
  clinics: Clinic[];
  availableSlots: TimeSlot[];
  dentists: Dentist[];
  bookingData: BookingData;
  patientData: PatientData;
  errors: BookingErrors;
  serviceTypes: ServiceType[];

  // Actions
  updateBookingData: (field: keyof BookingData, value: any) => void;
  updatePatientData: (field: keyof PatientData, value: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  submitBooking: () => Promise<Appointment | false>;
  resetBooking: () => void;
  validateStep: (step: number) => boolean;

  // Utilities
  loadClinics: () => Promise<void>;
  loadDentists: () => Promise<void>;
  loadServices: () => Promise<void>;
  loadAvailableSlots: () => Promise<void>;

  // Dialog
  confirmationDialog: any;
}

// Extract initial state to constants
const INITIAL_BOOKING_DATA: BookingData = {
  clinicId: '',
  dentistId: '',
  date: '',
  startTime: '',
  endTime: '',
  serviceType: '',
  serviceDuration: 30,
  reason: '',
  symptoms: '',
  urgency: 'medium',
  notes: '',
};

const INITIAL_PATIENT_DATA: PatientData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  emergencyContact: '',
};

/**
 * Custom hook for appointment booking workflow
 *
 * Features:
 * - Multi-step booking process
 * - Clinic and dentist selection
 * - Available slots fetching
 * - Patient profile creation for first-time bookings
 * - Form validation and error handling
 */
const useAppointmentBooking = (
  onBookingComplete?: (appointment: Appointment) => void,
): UseAppointmentBookingReturn => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { currentUser } = useAuth();
  const confirmationDialog = useConfirmationDialog();
  const { submitBooking } = useBookingSubmission();

  const [bookingData, setBookingData] = useState<BookingData>(INITIAL_BOOKING_DATA);
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [errors, setErrors] = useState<BookingErrors>({});

  // Use extracted data loading utilities
  const dataLoader = useAppointmentBookingData(setErrors);

  // Destructure for easier access
  const {
    clinics,
    dentists,
    services,
    availableSlots,
    loading: dataLoading,
    loadClinics,
    loadDentists: loadDentistsBase,
    loadServices: loadServicesBase,
    loadAvailableSlots: loadAvailableSlotsBase,
  } = dataLoader;

  const serviceTypes = useMemo<ServiceType[]>(() =>
    services.map((service) => ({
      id: String(service.id),
      name: service.name,
      duration: service.durationMinutes,
      serviceId: service.id,
      price: service.price ?? 0,
    })), [services]);

  // Wrapper functions to maintain existing API
  const loadDentists = useCallback(async (): Promise<void> => {
    await loadDentistsBase(bookingData.clinicId);
  }, [loadDentistsBase, bookingData.clinicId]);

  const loadServices = useCallback(async (): Promise<void> => {
    await loadServicesBase(bookingData.clinicId);
  }, [loadServicesBase, bookingData.clinicId]);

  const loadAvailableSlots = useCallback(async (): Promise<void> => {
    const selectedService = serviceTypes.find(
      (service) => service.id === bookingData.serviceType,
    );
    await loadAvailableSlotsBase(
      bookingData.clinicId,
      bookingData.dentistId,
      bookingData.date,
      selectedService ? String(selectedService.serviceId) : '',
      selectedService?.duration ?? 0,
    );
  }, [
    loadAvailableSlotsBase,
    bookingData.clinicId,
    bookingData.dentistId,
    bookingData.date,
    bookingData.serviceType,
    serviceTypes,
  ]);

  /**
   * Update booking data
   */
  const updateBookingData = useCallback((field: keyof BookingData, value: any): void => {
    setBookingData((prev) => {
      const updated = { ...prev, [field]: value };

      // A service determines the authoritative slot duration. Never retain a
      // selected interval when that duration changes.
      if (field === 'serviceType') {
        const service = serviceTypes.find((item) => item.id === value);
        updated.serviceDuration = service?.duration ?? 30;
        updated.startTime = '';
        updated.endTime = '';
      }

      // Clear dependent fields when parent fields change
      if (field === 'clinicId') {
        updated.dentistId = '';
        updated.serviceType = '';
        updated.serviceDuration = 30;
        updated.date = '';
        updated.startTime = '';
        updated.endTime = '';
      } else if (field === 'dentistId' || field === 'date' || field === 'serviceDuration') {
        updated.startTime = '';
        updated.endTime = '';
      }

      return updated;
    });

    // Clear related errors
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, [serviceTypes]);

  /**
   * Update patient data
   */
  const updatePatientData = useCallback((field: keyof PatientData, value: string): void => {
    setPatientData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  /**
   * Validate current step using extracted validation utilities
   */
  const validateStep = useCallback((step: number): boolean => {
    const validationContext = { currentUser, bookingData, patientData };
    const newErrors = validateBookingStep(step, validationContext);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [bookingData, patientData, currentUser]);

  /**
   * Go to next step
   */
  const nextStep = useCallback((): void => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep]);

  /**
   * Go to previous step
   */
  const previousStep = useCallback((): void => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  /**
   * Submit booking using extracted submission utility
   */
  const handleSubmitBooking = useCallback(async (): Promise<Appointment | false> => {
    if (!validateStep(currentStep)) {
      return false;
    }

    setLoading(true);
    try {
      const submissionContext = {
        currentUser,
        bookingData,
        patientData,
        serviceTypes,
        confirmationDialog,
        onBookingComplete,
      };

      const result = await submitBooking(submissionContext);

      if (result) {
        resetBooking();
      }

      return result;
    } finally {
      setLoading(false);
    }
  }, [
    currentStep,
    validateStep,
    currentUser,
    bookingData,
    patientData,
    serviceTypes,
    onBookingComplete,
    confirmationDialog,
    submitBooking,
  ]);

  /**
   * Reset booking form
   */
  const resetBooking = useCallback((): void => {
    setCurrentStep(0);
    setBookingData(INITIAL_BOOKING_DATA);
    setPatientData(INITIAL_PATIENT_DATA);
    setErrors({});
  }, []);

  // Load clinics on mount
  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  // Load dentists when clinic changes
  useEffect(() => {
    loadDentists();
  }, [loadDentists]);

  // Load services when clinic changes
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Load available slots when dependencies change
  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  return {
    // State
    currentStep,
    loading: loading || dataLoading,
    clinics,
    availableSlots,
    dentists,
    bookingData,
    patientData,
    errors,
    serviceTypes,

    // Actions
    updateBookingData,
    updatePatientData,
    nextStep,
    previousStep,
    submitBooking: handleSubmitBooking,
    resetBooking,
    validateStep,

    // Utilities
    loadClinics,
    loadDentists,
    loadServices,
    loadAvailableSlots,

    // Dialog
    confirmationDialog: confirmationDialog.dialogProps,
  };
};

export default useAppointmentBooking;
