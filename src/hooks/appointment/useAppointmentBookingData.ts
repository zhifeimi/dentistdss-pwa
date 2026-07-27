import { useCallback, useRef, useState } from 'react';
import api from '../../services';
import type { Clinic, ClinicService, Dentist, TimeSlot } from '../../types/api';
import type { BookingErrors } from './useAppointmentBooking';

/**
 * Data loading utilities for appointment booking
 * Extracted to follow Single Responsibility Principle
 */

export interface UseAppointmentBookingDataReturn {
  // State
  clinics: Clinic[];
  dentists: Dentist[];
  services: ClinicService[];
  availableSlots: TimeSlot[];
  loading: boolean;

  // Actions
  loadClinics: () => Promise<void>;
  loadDentists: (clinicId: string) => Promise<void>;
  loadServices: (clinicId: string) => Promise<void>;
  loadAvailableSlots: (
    clinicId: string,
    dentistId: string,
    date: string,
    serviceId: string,
    duration: number,
  ) => Promise<void>;

  // Error handling
  setDataError: (field: string, error: string) => void;
}

export const useAppointmentBookingData = (
  setErrors: (updater: (prev: BookingErrors) => BookingErrors) => void,
): UseAppointmentBookingDataReturn => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const pendingLoads = useRef(0);
  const clinicRequest = useRef(0);
  const dentistRequest = useRef(0);
  const serviceRequest = useRef(0);
  const slotRequest = useRef(0);

  const startLoading = useCallback(() => {
    pendingLoads.current += 1;
    setLoading(true);
  }, []);

  const finishLoading = useCallback(() => {
    pendingLoads.current = Math.max(0, pendingLoads.current - 1);
    setLoading(pendingLoads.current > 0);
  }, []);

  const setDataError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, [setErrors]);

  /**
   * Load available clinics
   */
  const loadClinics = useCallback(async (): Promise<void> => {
    const request = ++clinicRequest.current;
    startLoading();
    try {
      const clinicsData = await api.clinic.getClinics();
      if (request === clinicRequest.current) {
        setClinics(clinicsData || []);
        setDataError('clinics', '');
      }
    } catch (error: any) {
      console.error('Failed to load clinics:', error);
      if (request === clinicRequest.current) {
        setDataError('clinics', 'Failed to load clinics');
      }
    } finally {
      finishLoading();
    }
  }, [finishLoading, setDataError, startLoading]);

  /**
   * Load dentists for selected clinic
   */
  const loadDentists = useCallback(async (clinicId: string): Promise<void> => {
    const request = ++dentistRequest.current;
    setDentists([]);
    setDataError('dentists', '');

    if (!clinicId) {
      return;
    }

    startLoading();
    try {
      const dentistsData = await api.clinic.getClinicDentists(Number(clinicId));
      if (request === dentistRequest.current) {
        setDentists(dentistsData || []);
      }
    } catch (error: any) {
      console.error('Failed to load dentists:', error);
      if (request === dentistRequest.current) {
        setDataError('dentists', 'Failed to load dentists');
      }
    } finally {
      finishLoading();
    }
  }, [finishLoading, setDataError, startLoading]);

  /**
   * Load active services for the selected clinic
   */
  const loadServices = useCallback(async (clinicId: string): Promise<void> => {
    const request = ++serviceRequest.current;
    setServices([]);
    setDataError('services', '');

    if (!clinicId) {
      return;
    }

    startLoading();
    try {
      const servicesData = await api.clinic.getServices(Number(clinicId));
      if (request === serviceRequest.current) {
        setServices((servicesData || []).filter((service) => service.isActive));
      }
    } catch (error: any) {
      console.error('Failed to load services:', error);
      if (request === serviceRequest.current) {
        setDataError('services', 'Failed to load clinic services');
      }
    } finally {
      finishLoading();
    }
  }, [finishLoading, setDataError, startLoading]);

  /**
   * Load authoritative slots for the selected clinic, dentist, date, and service.
   */
  const loadAvailableSlots = useCallback(async (
    clinicId: string,
    dentistId: string,
    date: string,
    serviceId: string,
    duration: number,
  ): Promise<void> => {
    const request = ++slotRequest.current;
    setAvailableSlots([]);
    setDataError('slots', '');

    const parsedClinicId = Number(clinicId);
    const parsedDentistId = Number(dentistId);
    const parsedServiceId = Number(serviceId);
    if (!date
      || !Number.isSafeInteger(parsedClinicId)
      || !Number.isSafeInteger(parsedDentistId)
      || !Number.isSafeInteger(parsedServiceId)
      || parsedClinicId <= 0
      || parsedDentistId <= 0
      || parsedServiceId <= 0
      || !Number.isSafeInteger(duration)
      || duration <= 0) {
      return;
    }

    startLoading();
    try {
      const slots = await api.appointment.getAvailableSlots(
        parsedDentistId,
        parsedClinicId,
        date,
        parsedServiceId,
        duration,
      );
      if (request === slotRequest.current) {
        setAvailableSlots(slots || []);
      }
    } catch (error: any) {
      console.error('Failed to load available slots:', error);
      if (request === slotRequest.current) {
        setDataError('slots', 'Failed to load available time slots');
      }
    } finally {
      finishLoading();
    }
  }, [finishLoading, setDataError, startLoading]);

  return {
    // State
    clinics,
    dentists,
    services,
    availableSlots,
    loading,

    // Actions
    loadClinics,
    loadDentists,
    loadServices,
    loadAvailableSlots,

    // Error handling
    setDataError,
  };
};
