import api from './config';
import {
  Clinic,
  ClinicSearchResult,
  ClinicService,
  CreateHolidayRequest,
  CreateServiceRequest,
  Dentist,
  DentistAvailability,
  Holiday,
  TimeSlot,
  UpdateClinicRequest,
} from '../types';

const clinicAPI = {
  async getClinics(): Promise<Clinic[]> {
    return api.get('/api/clinic/list/all');
  },

  async searchClinics(keywords: string): Promise<ClinicSearchResult[]> {
    try {
      // Public: anonymous visitors search from Find a clinic.
      const response = await api.post('/api/clinic/search', {
        keywords,
      }) as ClinicSearchResult[];
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get clinic details by ID
   * @param clinicId - The clinic ID
   * @returns Clinic details object
   */
  async getClinicById(clinicId: number): Promise<Clinic> {
    return api.get(`/api/clinic/${clinicId}`);
  },

  /**
   * Update clinic details
   * @param clinicId - The clinic ID
   * @param updates - The updates to apply to the clinic
   * @returns Updated clinic details object
   */
  async updateClinic(clinicId: number, updates: UpdateClinicRequest): Promise<Clinic> {
    return api.put(`/api/clinic/${clinicId}`, updates);
  },

  // Schedule Management API Methods

  /**
   * Get dentist availability for a date range
   * @param dentistId - The dentist's user ID
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of availability objects
   */
  async getDentistAvailability(
    dentistId: number,
    startDate: string,
    endDate: string,
  ): Promise<DentistAvailability[]> {
    return api.get(`/api/clinic/dentist-availability/dentist/${dentistId}`, {
      params: { startDate, endDate },
    });
  },

  /**
   * Get dentist availability for a specific date
   * @param dentistId - The dentist's user ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Array of availability objects
   */
  async getDentistAvailabilityByDate(
    dentistId: number,
    date: string,
  ): Promise<DentistAvailability[]> {
    return api.get(`/api/clinic/dentist-availability/dentist/${dentistId}/date/${date}`);
  },

  /**
   * Get available slots for a dentist
   * @param dentistId - The dentist's user ID
   * @param clinicId - The clinic ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Array of available slot objects
   */
  async getAvailableSlots(dentistId: number, clinicId: number, date: string): Promise<TimeSlot[]> {
    return api.get('/api/clinic/dentist-availability/available-slots', {
      params: { dentistId, clinicId, date },
    });
  },

  /**
   * Create new availability slot
   * @param availabilityData - Availability data object
   * @returns Created availability object
   */
  async createAvailability(availabilityData: {
    dentistId: number;
    clinicId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    effectiveFrom: string;
    effectiveUntil: string;
  }): Promise<DentistAvailability> {
    return api.post('/api/clinic/dentist-availability', availabilityData);
  },

  /**
   * Block an availability slot
   * @param id - Availability slot ID
   * @param reason - Reason for blocking
   * @returns Updated availability object
   */
  async blockAvailabilitySlot(id: number, reason: string): Promise<DentistAvailability> {
    return api.put(`/api/clinic/dentist-availability/${id}/block`, { reason });
  },

  /**
   * Unblock an availability slot
   * @param id - Availability slot ID
   * @returns Updated availability object
   */
  async unblockAvailabilitySlot(id: number): Promise<DentistAvailability> {
    return api.put(`/api/clinic/dentist-availability/${id}/unblock`);
  },

  /**
   * Delete an availability slot
   * @param id - Availability slot ID
   * @returns Success response
   */
  async deleteAvailabilitySlot(id: number): Promise<void> {
    return api.delete(`/api/clinic/dentist-availability/${id}`);
  },

  /**
   * Get clinic dentists
   * @param clinicId - The clinic ID
   * @returns Array of dentist objects
   */
  async getClinicDentists(clinicId: number): Promise<Dentist[]> {
    return api.get(`/api/clinic/${clinicId}/dentists`);
  },

  /**
   * Get all dentists (for backward compatibility)
   * @param clinicId - Optional clinic ID to filter dentists
   * @returns Array of dentist objects
   */
  async getDentists(clinicId?: number): Promise<Dentist[]> {
    if (clinicId) {
      return this.getClinicDentists(clinicId);
    }
    return api.get('/api/clinic/dentists/all');
  },

  /**
   * Get clinic services
   * @param clinicId - Optional clinic ID to filter services
   * @returns Array of service objects
   */
  async getServices(clinicId?: number): Promise<ClinicService[]> {
    if (clinicId) {
      return api.get(`/api/clinic/service/clinic/${clinicId}`);
    }
    return api.get('/api/clinic/services/all');
  },

  /** Add a service to the clinic's catalogue (clinic admin of that clinic). */
  async createService(service: CreateServiceRequest): Promise<ClinicService> {
    return api.post('/api/clinic/service', service);
  },

  /** Remove a service; the backend deactivates it so past bookings keep their record. */
  async deleteService(serviceId: number): Promise<void> {
    return api.delete(`/api/clinic/service/${serviceId}`);
  },

  // Clinical Notes API Methods

  /**
   * Get patient records for a specific dentist
   * @param dentistId - The dentist's user ID
   * @returns Array of patient record objects
   */
  async getDentistPatientRecords(dentistId: number): Promise<any[]> {
    return api.get(`/api/clinic/clinical-note/dentist/${dentistId}`);
  },

  /**
   * Get patient records for a specific clinic
   * @param clinicId - The clinic ID
   * @returns Array of patient record objects
   */
  async getClinicPatientRecords(clinicId: number): Promise<any[]> {
    return api.get(`/api/clinic/clinical-note/clinic/${clinicId}`);
  },

  // Holiday Management API Methods (clinic-service /clinic/{clinicId}/holidays)

  /** All holidays for a clinic; a recurring one shows its next date. */
  async getClinicHolidays(clinicId: number): Promise<Holiday[]> {
    return api.get(`/api/clinic/${clinicId}/holidays`);
  },

  /** Holidays in the next 30 days, soonest first. */
  async getUpcomingHolidays(clinicId: number): Promise<Holiday[]> {
    return api.get(`/api/clinic/${clinicId}/holidays/upcoming`);
  },

  async createHoliday(clinicId: number, holidayData: CreateHolidayRequest): Promise<Holiday> {
    return api.post(`/api/clinic/${clinicId}/holidays`, holidayData);
  },

  async updateHoliday(clinicId: number, holidayId: number, holidayData: CreateHolidayRequest): Promise<Holiday> {
    return api.put(`/api/clinic/${clinicId}/holidays/${holidayId}`, holidayData);
  },

  async deleteHoliday(clinicId: number, holidayId: number): Promise<void> {
    return api.delete(`/api/clinic/${clinicId}/holidays/${holidayId}`);
  },

  // Working Hours Management API Methods

};

export default clinicAPI;
