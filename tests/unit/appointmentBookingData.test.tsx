import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TimeSlot } from '../../src/types/api';

const mocks = vi.hoisted(() => ({
  getAvailableSlots: vi.fn(),
  getClinics: vi.fn(),
  getClinicDentists: vi.fn(),
  getServices: vi.fn(),
}));

vi.mock('../../src/services', () => ({
  default: {
    appointment: {
      getAvailableSlots: mocks.getAvailableSlots,
    },
    clinic: {
      getClinics: mocks.getClinics,
      getClinicDentists: mocks.getClinicDentists,
      getServices: mocks.getServices,
    },
  },
}));

import { useAppointmentBookingData } from '../../src/hooks/appointment/useAppointmentBookingData';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const slot = (startTime: string, endTime: string, date = '2026-08-01'): TimeSlot => ({
  startTime,
  endTime,
  available: true,
  dentistId: 84,
  clinicId: 7,
  date,
});

describe('useAppointmentBookingData', () => {
  beforeEach(() => {
    mocks.getAvailableSlots.mockReset();
    mocks.getClinics.mockReset();
    mocks.getClinicDentists.mockReset();
    mocks.getServices.mockReset();
  });

  it('passes the selected persisted service ID and duration to slot lookup', async () => {
    const selectedSlot = slot('10:00:00', '10:45:00');
    mocks.getAvailableSlots.mockResolvedValue([selectedSlot]);
    const setErrors = vi.fn();
    const { result } = renderHook(() => useAppointmentBookingData(setErrors));

    await act(async () => {
      await result.current.loadAvailableSlots(
        '7',
        '84',
        '2026-08-01',
        '42',
        45,
      );
    });

    expect(mocks.getAvailableSlots).toHaveBeenCalledWith(
      84,
      7,
      '2026-08-01',
      42,
      45,
    );
    expect(result.current.availableSlots).toEqual([selectedSlot]);
  });

  it('keeps loading until overlapping requests settle and discards stale slots', async () => {
    const firstRequest = deferred<TimeSlot[]>();
    const secondRequest = deferred<TimeSlot[]>();
    const firstSlot = slot('09:00:00', '09:30:00', '2026-08-01');
    const secondSlot = slot('14:00:00', '14:45:00', '2026-08-02');
    mocks.getAvailableSlots
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const setErrors = vi.fn();
    const { result } = renderHook(() => useAppointmentBookingData(setErrors));

    let firstLoad!: Promise<void>;
    let secondLoad!: Promise<void>;
    act(() => {
      firstLoad = result.current.loadAvailableSlots(
        '7',
        '84',
        '2026-08-01',
        '42',
        30,
      );
      secondLoad = result.current.loadAvailableSlots(
        '7',
        '84',
        '2026-08-02',
        '42',
        45,
      );
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      secondRequest.resolve([secondSlot]);
      await secondLoad;
    });

    expect(result.current.availableSlots).toEqual([secondSlot]);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      firstRequest.resolve([firstSlot]);
      await firstLoad;
    });

    expect(result.current.availableSlots).toEqual([secondSlot]);
    expect(result.current.loading).toBe(false);
  });

  it('does not issue a slot request without a selected persisted service', async () => {
    const setErrors = vi.fn();
    const { result } = renderHook(() => useAppointmentBookingData(setErrors));

    await act(async () => {
      await result.current.loadAvailableSlots(
        '7',
        '84',
        '2026-08-01',
        '',
        30,
      );
    });

    expect(mocks.getAvailableSlots).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
