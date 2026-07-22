import api from './config';
import type {
  Appointment,
  CancelAppointmentRequest,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
  TimeSlot,
} from '../types';

/**
 * Appointment API Service
 *
 * All appointment routes require an authenticated access token. Actor identity
 * is derived by the backend from that token and is never sent in request data.
 */
const appointmentAPI = {
  async getAvailableSlots(
    dentistId: number,
    clinicId: number,
    date: string,
    serviceId: number,
    serviceDurationMinutes: number,
  ): Promise<TimeSlot[]> {
    return api.get('/api/appointment/available-slots', {
      params: { dentistId, clinicId, date, serviceId, serviceDurationMinutes },
    });
  },

  async getClinicAppointments(
    clinicId: number,
    date: string,
  ): Promise<Appointment[]> {
    return api.get(`/api/appointment/clinic/${clinicId}`, {
      params: { date },
    });
  },

  async getDentistAppointments(
    dentistId: number,
    date: string,
  ): Promise<Appointment[]> {
    return api.get(`/api/appointment/dentist/${dentistId}`, {
      params: { date },
    });
  },

  async getPatientAppointments(patientId: number): Promise<Appointment[]> {
    return api.get(`/api/appointment/patient/${patientId}`);
  },

  async rescheduleAppointment(
    id: number,
    request: RescheduleAppointmentRequest,
  ): Promise<Appointment> {
    return api.patch(`/api/appointment/${id}/reschedule`, request);
  },

  async markNoShow(id: number): Promise<Appointment> {
    return api.patch(`/api/appointment/${id}/no-show`);
  },

  async confirmAppointment(id: number): Promise<Appointment> {
    return api.patch(`/api/appointment/${id}/confirm`);
  },

  async completeAppointment(id: number): Promise<Appointment> {
    return api.patch(`/api/appointment/${id}/complete`);
  },

  async cancelAppointment(
    id: number,
    request: CancelAppointmentRequest,
  ): Promise<Appointment> {
    return api.patch(`/api/appointment/${id}/cancel`, request);
  },

  async createAppointment(
    appointmentData: CreateAppointmentRequest,
  ): Promise<Appointment> {
    return api.post('/api/appointment/create', appointmentData);
  },
};

export default appointmentAPI;
