import { useCallback } from 'react';
import api from '../../services';
import type { Appointment, CreateAppointmentRequest } from '../../types/api';
import type { UrgencyLevel } from '../../types/common';
import type { BookingData, PatientData, ServiceType } from './useAppointmentBooking';
import { validateAppointmentData } from './useAppointmentBookingValidation';

export interface BookingSubmissionContext {
  currentUser: any;
  bookingData: BookingData;
  patientData: PatientData;
  serviceTypes: ServiceType[];
  confirmationDialog: any;
  onBookingComplete?: (appointment: Appointment) => void;
}

export const getServiceId = (
  serviceType: string,
  serviceTypes: ServiceType[],
): number => {
  const selectedService = serviceTypes.find((service) => service.id === serviceType);
  if (!selectedService) {
    throw new Error(`Invalid service type: ${serviceType}`);
  }
  return selectedService.serviceId;
};

const toApiUrgency = (urgency: BookingData['urgency']): UrgencyLevel => {
  switch (urgency) {
    case 'low':
      return 'ROUTINE';
    case 'high':
      return 'URGENT';
    default:
      return 'MODERATE';
  }
};

export const buildAppointmentData = (
  context: BookingSubmissionContext,
  serviceId: number,
): CreateAppointmentRequest => {
  const { bookingData } = context;

  return {
    dentistId: Number(bookingData.dentistId),
    clinicId: Number(bookingData.clinicId),
    serviceId,
    appointmentDate: bookingData.date,
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
    reasonForVisit: bookingData.reason,
    symptoms: bookingData.symptoms || '',
    urgencyLevel: toApiUrgency(bookingData.urgency),
    notes: bookingData.notes || '',
  };
};

export const handleBookingSuccess = async (
  appointment: Appointment,
  context: BookingSubmissionContext,
): Promise<void> => {
  const { currentUser, confirmationDialog, onBookingComplete } = context;

  confirmationDialog.showSuccess(
    'Appointment Booked',
    'Your appointment has been successfully booked. You will receive a confirmation email shortly.',
  );

  if (currentUser?.roles?.includes('PATIENT')) {
    try {
      await api.appointment.getPatientAppointments(currentUser.id);
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
    }
  }

  if (onBookingComplete) {
    onBookingComplete(appointment);
  }
};

export const handleBookingError = (
  error: any,
  confirmationDialog: any,
): void => {
  console.error('Failed to book appointment:', error);

  let errorMessage = 'Failed to book the appointment. Please try again.';
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error instanceof Error && error.message) {
    errorMessage = error.message;
  }

  confirmationDialog.showError('Booking Failed', errorMessage);
};

export const useBookingSubmission = () => {
  const submitBooking = useCallback(async (
    context: BookingSubmissionContext,
  ): Promise<Appointment | false> => {
    const { currentUser, bookingData, serviceTypes } = context;

    try {
      if (!currentUser?.id) {
        throw new Error('Authentication is required to book an appointment');
      }
      if (!currentUser.roles?.includes('PATIENT')) {
        throw new Error('A patient account is required to book an appointment');
      }

      const serviceId = getServiceId(
        bookingData.serviceType,
        serviceTypes,
      );
      const appointmentData = buildAppointmentData(context, serviceId);
      const validation = validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        throw new Error(
          `Missing required fields: ${validation.missingFields.join(', ')}`,
        );
      }

      const newAppointment = await api.appointment.createAppointment(
        appointmentData,
      );
      await handleBookingSuccess(newAppointment, context);
      return newAppointment;
    } catch (error: any) {
      handleBookingError(error, context.confirmationDialog);
      return false;
    }
  }, []);

  return { submitBooking };
};
