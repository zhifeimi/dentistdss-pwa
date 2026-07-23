import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../../src/services/config', () => ({
  broadcastSessionEnded: vi.fn(),
  clearBearerSession: vi.fn(),
  clearXsrfToken: vi.fn(),
  CSRF_BOOTSTRAP_PATH: '/api/auth/csrf',
  ensureXsrfBootstrapped: vi.fn(() => Promise.resolve()),
  refreshSession: vi.fn(() =>
    Promise.reject(new Error('refreshSession is not used in appointment tests'))
  ),
  setBearerSession: vi.fn(),
  default: {
    get: mocks.get,
    patch: mocks.patch,
    post: mocks.post,
  },
}));

import appointmentAPI from '../../src/services/appointment';
import clinicAPI from '../../src/services/clinic';
import {
  buildAppointmentData,
  getServiceId,
  handleBookingError,
} from '../../src/hooks/appointment/useAppointmentBookingSubmission';
import { getStatusChip } from '../../src/utils/chatUtils';
import {
  adjustStepIndex,
  getWizardSteps,
} from '../../src/components/Dashboard/shared/BookingWizard/utils';
import { validateBookingStep } from '../../src/hooks/appointment/useAppointmentBookingValidation';
import { resolveAppointmentRole } from '../../src/hooks/appointment/useAppointments';

describe('appointment API contracts', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.patch.mockReset();
    mocks.post.mockReset();
  });

  it('uses the authenticated appointment route for available slots', async () => {
    mocks.get.mockResolvedValue([]);

    await appointmentAPI.getAvailableSlots(84, 7, '2026-08-01', 42, 30);

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/appointment/available-slots',
      {
        params: {
          dentistId: 84,
          clinicId: 7,
          date: '2026-08-01',
          serviceId: 42,
          serviceDurationMinutes: 30,
        },
      },
    );
  });

  it('requires dates for clinic and dentist lists', async () => {
    mocks.get.mockResolvedValue([]);

    await appointmentAPI.getClinicAppointments(7, '2026-08-01');
    await appointmentAPI.getDentistAppointments(84, '2026-08-02');

    expect(mocks.get).toHaveBeenNthCalledWith(
      1,
      '/api/appointment/clinic/7',
      { params: { date: '2026-08-01' } },
    );
    expect(mocks.get).toHaveBeenNthCalledWith(
      2,
      '/api/appointment/dentist/84',
      { params: { date: '2026-08-02' } },
    );
  });

  it('sends rescheduling without a caller-controlled actor', async () => {
    mocks.patch.mockResolvedValue({});
    const request = {
      newDate: '2026-08-03',
      newStartTime: '10:00:00',
      newEndTime: '10:30:00',
    };

    await appointmentAPI.rescheduleAppointment(100, request);

    expect(mocks.patch).toHaveBeenCalledWith(
      '/api/appointment/100/reschedule',
      request,
    );
    expect(request).not.toHaveProperty('rescheduledBy');
  });

  it('sends cancellation without a caller-controlled actor', async () => {
    mocks.patch.mockResolvedValue({});
    const request = { reason: 'Schedule changed' };

    await appointmentAPI.cancelAppointment(100, request);

    expect(mocks.patch).toHaveBeenCalledWith(
      '/api/appointment/100/cancel',
      request,
    );
    expect(request).not.toHaveProperty('cancelledBy');
  });

  it('confirms without an actor body', async () => {
    mocks.patch.mockResolvedValue({});

    await appointmentAPI.confirmAppointment(100);

    expect(mocks.patch).toHaveBeenCalledWith(
      '/api/appointment/100/confirm',
    );
  });

  it('creates through the appointment route', async () => {
    mocks.post.mockResolvedValue({});
    const request = {
      dentistId: 84,
      clinicId: 7,
      serviceId: 1,
      appointmentDate: '2026-08-01',
      startTime: '10:00:00',
      endTime: '10:30:00',
      reasonForVisit: 'Checkup',
      urgencyLevel: 'ROUTINE' as const,
    };

    await appointmentAPI.createAppointment(request);

    expect(mocks.post).toHaveBeenCalledWith(
      '/api/appointment/create',
      request,
    );
  });

  it('loads services from the selected clinic route', async () => {
    mocks.get.mockResolvedValue([]);

    await clinicAPI.getServices(7);

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/clinic/service/clinic/7',
    );
  });

  it('submits the persisted service ID selected from clinic data', () => {
    expect(getServiceId('42', [{
      id: '42',
      name: 'Dental Cleaning',
      duration: 45,
      serviceId: 42,
      price: 200,
    }])).toBe(42);
  });

  it('builds patient booking data without identity evidence', () => {
    const request = buildAppointmentData({
      currentUser: { id: 42, roles: ['PATIENT'] },
      bookingData: {
        clinicId: '7',
        dentistId: '84',
        date: '2026-08-01',
        startTime: '10:00:00',
        endTime: '10:30:00',
        serviceType: 'checkup',
        serviceDuration: 30,
        reason: 'Checkup',
        symptoms: '',
        urgency: 'medium',
        notes: '',
      },
      patientData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
      },
      serviceTypes: [],
      confirmationDialog: {},
    }, 1);

    expect(request).not.toHaveProperty('patientId');
    expect(request).not.toHaveProperty('createdBy');
    expect(request.urgencyLevel).toBe('MODERATE');
  });

  it('renders backend appointment statuses with friendly labels', () => {
    expect(getStatusChip('REQUESTED').props.label).toBe('Requested');
    expect(getStatusChip('RESCHEDULED').props.label).toBe('Rescheduled');
    expect(getStatusChip('NO_SHOW').props.label).toBe('No-Show');
  });

  it('selects a persisted service before requesting duration-aware slots', () => {
    expect(getWizardSteps(true)).toEqual([
      'Select Clinic',
      'Service Details',
      'Choose Date & Time',
      'Confirmation',
    ]);
    expect([0, 1, 2, 3].map((step) => adjustStepIndex(step, true)))
      .toEqual([0, 2, 1, 4]);

    const errors = validateBookingStep(1, {
      currentUser: { id: 42, roles: ['PATIENT'] },
      bookingData: {
        clinicId: '7',
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
      },
      patientData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
      },
    });

    expect(errors).toEqual({
      serviceType: 'Please select a service type',
      reason: 'Please provide a reason for the appointment',
    });
  });

  it('uses the selected dashboard role instead of the first account role', () => {
    expect(resolveAppointmentRole('DENTIST', ['PATIENT', 'DENTIST']))
      .toBe('DENTIST');
    expect(resolveAppointmentRole(undefined, ['PATIENT', 'DENTIST']))
      .toBe('PATIENT');
  });

  it('shows local authentication failures without a generic fallback', () => {
    const confirmationDialog = { showError: vi.fn() };

    handleBookingError(
      new Error('A patient account is required to book an appointment'),
      confirmationDialog,
    );

    expect(confirmationDialog.showError).toHaveBeenCalledWith(
      'Booking Failed',
      'A patient account is required to book an appointment',
    );
  });
});
