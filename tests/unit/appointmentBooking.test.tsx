import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadClinics: vi.fn(),
  loadDentists: vi.fn(),
  loadServices: vi.fn(),
  loadAvailableSlots: vi.fn(),
}));

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({ currentUser: null }),
}));

vi.mock('../../src/hooks/appointment/useAppointmentBookingData', () => ({
  useAppointmentBookingData: () => ({
    clinics: [],
    dentists: [],
    services: [
      {
        id: 42,
        name: 'Cleaning',
        durationMinutes: 45,
        price: 120,
        isActive: true,
      },
      {
        id: 43,
        name: 'Exam',
        durationMinutes: 60,
        price: 160,
        isActive: true,
      },
    ],
    availableSlots: [],
    loading: false,
    loadClinics: mocks.loadClinics,
    loadDentists: mocks.loadDentists,
    loadServices: mocks.loadServices,
    loadAvailableSlots: mocks.loadAvailableSlots,
    setDataError: vi.fn(),
  }),
}));

import useAppointmentBooking from '../../src/hooks/appointment/useAppointmentBooking';

describe('useAppointmentBooking', () => {
  beforeEach(() => {
    mocks.loadClinics.mockReset();
    mocks.loadDentists.mockReset();
    mocks.loadServices.mockReset();
    mocks.loadAvailableSlots.mockReset();
    mocks.loadClinics.mockResolvedValue(undefined);
    mocks.loadDentists.mockResolvedValue(undefined);
    mocks.loadServices.mockResolvedValue(undefined);
    mocks.loadAvailableSlots.mockResolvedValue(undefined);
  });

  it('clears an existing interval and derives lookup arguments from the replacement service', async () => {
    const { result } = renderHook(() => useAppointmentBooking());

    act(() => {
      result.current.updateBookingData('clinicId', '7');
      result.current.updateBookingData('dentistId', '84');
      result.current.updateBookingData('date', '2026-08-01');
      result.current.updateBookingData('serviceType', '42');
      result.current.updateBookingData('startTime', '10:00:00');
      result.current.updateBookingData('endTime', '10:45:00');
    });

    expect(result.current.bookingData.startTime).toBe('10:00:00');
    expect(result.current.bookingData.endTime).toBe('10:45:00');

    act(() => {
      result.current.updateBookingData('serviceType', '43');
    });

    expect(result.current.bookingData.serviceDuration).toBe(60);
    expect(result.current.bookingData.startTime).toBe('');
    expect(result.current.bookingData.endTime).toBe('');

    mocks.loadAvailableSlots.mockClear();
    await act(async () => {
      await result.current.loadAvailableSlots();
    });

    expect(mocks.loadAvailableSlots).toHaveBeenCalledWith(
      '7',
      '84',
      '2026-08-01',
      '43',
      60,
    );
  });
});
