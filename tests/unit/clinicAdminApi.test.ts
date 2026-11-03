import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../src/services/config', () => ({
  default: mocks,
}));

import clinicAPI from '../../src/services/clinic';
import { serviceFormErrors } from '../../src/pages/DashboardPages/ServicesPage/index.tsx';

const holiday = {
  name: 'Christmas Day',
  holidayDate: '2026-12-25',
  description: '',
  type: 'NATIONAL_HOLIDAY' as const,
  isFullDayClosure: true,
  isRecurring: true,
};

describe('clinic admin API routes', () => {
  beforeEach(() => Object.values(mocks).forEach((fn) => fn.mockReset()));

  it('manages holidays under the clinic-service route the gateway forwards', async () => {
    await clinicAPI.getClinicHolidays(7);
    await clinicAPI.getUpcomingHolidays(7);
    await clinicAPI.createHoliday(7, holiday);
    await clinicAPI.updateHoliday(7, 3, holiday);
    await clinicAPI.deleteHoliday(7, 3);

    expect(mocks.get).toHaveBeenCalledWith('/api/clinic/7/holidays');
    expect(mocks.get).toHaveBeenCalledWith('/api/clinic/7/holidays/upcoming');
    expect(mocks.post).toHaveBeenCalledWith('/api/clinic/7/holidays', holiday);
    expect(mocks.put).toHaveBeenCalledWith('/api/clinic/7/holidays/3', holiday);
    expect(mocks.delete).toHaveBeenCalledWith('/api/clinic/7/holidays/3');
  });

  it('adds and removes clinic services', async () => {
    const service = { clinicId: 7, name: 'Check-up', durationMinutes: 30, price: 120 };

    await clinicAPI.createService(service);
    await clinicAPI.deleteService(5);

    expect(mocks.post).toHaveBeenCalledWith('/api/clinic/service', service);
    expect(mocks.delete).toHaveBeenCalledWith('/api/clinic/service/5');
  });
});

describe('add-service form', () => {
  it.each(['15', '480'])('accepts a bookable %s-minute service with a positive price', (durationMinutes) => {
    expect(serviceFormErrors({ name: 'Check-up', durationMinutes, price: '120', description: '' })).toEqual({});
  });

  it.each(['14', '481', '600', '15.5'])('rejects an unsupported duration of %s minutes', (durationMinutes) => {
    expect(serviceFormErrors({ name: 'Check-up', durationMinutes, price: '120', description: '' }))
      .toHaveProperty('durationMinutes');
  });

  it.each(['', '0', '-1', 'Infinity'])('rejects a non-positive or invalid price %j', (price) => {
    expect(serviceFormErrors({ name: 'Check-up', durationMinutes: '30', price, description: '' }))
      .toHaveProperty('price');
  });

  it('flags a missing name, short duration and missing price', () => {
    expect(serviceFormErrors({ name: ' ', durationMinutes: '10', price: '', description: '' })).toEqual({
      name: 'Enter a service name',
      durationMinutes: 'Enter a whole number from 15 to 480 minutes',
      price: 'Enter a price greater than 0',
    });
  });
});
