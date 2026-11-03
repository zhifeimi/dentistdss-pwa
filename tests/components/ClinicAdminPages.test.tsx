import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HolidayForm from '../../src/pages/DashboardPages/HolidayManagementPage/components/HolidayForm';
import ServicesPage from '../../src/pages/DashboardPages/ServicesPage';
import UserManagementPage from '../../src/pages/DashboardPages/UserManagementPage';
import type { ClinicService, Holiday, User } from '../../src/types';

vi.unmock('@mui/material/styles');

const mocks = vi.hoisted(() => ({
  getServices: vi.fn(),
  createService: vi.fn(),
  deleteService: vi.fn(),
  createHoliday: vi.fn(),
  updateHoliday: vi.fn(),
  deleteHoliday: vi.fn(),
  getClinicStaff: vi.fn(),
  getAllUsers: vi.fn(),
}));

vi.mock('../../src/services', () => ({
  default: {
    clinic: {
      getServices: mocks.getServices,
      createService: mocks.createService,
      deleteService: mocks.deleteService,
      createHoliday: mocks.createHoliday,
      updateHoliday: mocks.updateHoliday,
      deleteHoliday: mocks.deleteHoliday,
    },
    user: {
      getClinicStaff: mocks.getClinicStaff,
      getAllUsers: mocks.getAllUsers,
    },
  },
}));

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({ currentUser: admin }),
}));

const admin: User = {
  id: 1,
  firstName: 'Alex',
  lastName: 'Lee',
  email: 'admin@example.com',
  roles: ['CLINIC_ADMIN'],
  clinicId: 7,
  isEmailVerified: true,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const service: ClinicService = {
  id: 5,
  name: 'Check-up',
  description: 'Routine check',
  durationMinutes: 45,
  price: 120.5,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const holiday: Holiday = {
  id: 3,
  clinicId: 7,
  name: 'Christmas Day',
  holidayDate: '2030-12-25',
  description: 'Closed for Christmas',
  type: 'NATIONAL_HOLIDAY',
  typeDisplayName: 'National holiday',
  isFullDayClosure: true,
  isRecurring: false,
  isUpcoming: false,
  daysUntilHoliday: 1513,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function fillService(price = '120.50', durationMinutes = '45') {
  fireEvent.change(screen.getByRole('textbox', { name: /Service name/ }), {
    target: { value: ' Check-up ' },
  });
  fireEvent.change(screen.getByRole('spinbutton', { name: /Duration/ }), {
    target: { value: durationMinutes },
  });
  fireEvent.change(screen.getByRole('spinbutton', { name: /Price/ }), {
    target: { value: price },
  });
}

afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.getServices.mockResolvedValue([]);
  mocks.createService.mockResolvedValue(service);
  mocks.deleteService.mockResolvedValue(undefined);
  mocks.updateHoliday.mockResolvedValue(holiday);
  mocks.deleteHoliday.mockResolvedValue(undefined);
});

describe('clinic services page', () => {
  it('submits the linked clinic and numeric values, then refreshes after adding and removing', async () => {
    const user = userEvent.setup();
    mocks.getServices.mockResolvedValueOnce([]).mockResolvedValueOnce([service]).mockResolvedValueOnce([]);
    render(<ServicesPage />);
    await screen.findByText('No services yet');
    fillService();
    fireEvent.change(screen.getByRole('textbox', { name: /Description/ }), {
      target: { value: ' Routine check ' },
    });

    await user.click(screen.getByRole('button', { name: 'Add service' }));

    expect(mocks.createService).toHaveBeenCalledWith({
      clinicId: 7,
      name: 'Check-up',
      durationMinutes: 45,
      price: 120.5,
      description: 'Routine check',
    });
    expect(await screen.findByText('Check-up')).toBeInTheDocument();
    expect(mocks.getServices).toHaveBeenCalledWith(7);
    expect(screen.getByRole('textbox', { name: /Service name/ })).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Remove Check-up' }));

    expect(mocks.deleteService).toHaveBeenCalledWith(5);
    expect(await screen.findByText('No services yet')).toBeInTheDocument();
    expect(screen.queryByText('Check-up')).not.toBeInTheDocument();
  });

  it.each([
    { price: '0', duration: '30', field: /Price/ },
    { price: '120', duration: '600', field: /Duration/ },
  ])('blocks unsupported service input $price / $duration before sending it', async ({ price, duration, field }) => {
    const user = userEvent.setup();
    render(<ServicesPage />);
    await screen.findByText('No services yet');
    fillService(price, duration);

    await user.click(screen.getByRole('button', { name: 'Add service' }));

    expect(screen.getByRole('spinbutton', { name: field })).toHaveAttribute('aria-invalid', 'true');
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it.each(['success', 'failure'])('ignores a stale initial load %s after a successful addition', async (outcome) => {
    const user = userEvent.setup();
    let resolveInitial!: (services: ClinicService[]) => void;
    let rejectInitial!: (error: Error) => void;
    const initial = new Promise<ClinicService[]>((resolve, reject) => {
      resolveInitial = resolve;
      rejectInitial = reject;
    });
    mocks.getServices.mockReturnValueOnce(initial).mockResolvedValueOnce([service]);
    render(<ServicesPage />);
    fillService();

    await user.click(screen.getByRole('button', { name: 'Add service' }));
    expect(await screen.findByText('Check-up')).toBeInTheDocument();

    await act(async () => {
      if (outcome === 'success') resolveInitial([]);
      else rejectInitial(new Error('Initial request failed'));
      await initial.catch(() => {});
    });

    expect(screen.getByText('Check-up')).toBeInTheDocument();
    expect(screen.queryByText('No services yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('holiday form actions', () => {
  it('updates the existing holiday instead of creating a duplicate', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<HolidayForm open holiday={holiday} clinicId={7} onClose={vi.fn()} onSaved={onSaved} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Holiday name/ }), {
      target: { value: 'Christmas closure' },
    });

    await user.click(screen.getByRole('button', { name: 'Save holiday' }));

    expect(mocks.updateHoliday).toHaveBeenCalledWith(7, 3, {
      name: 'Christmas closure',
      holidayDate: '2030-12-25',
      description: 'Closed for Christmas',
      type: 'NATIONAL_HOLIDAY',
      isFullDayClosure: true,
      isRecurring: false,
      specialOpeningTime: undefined,
      specialClosingTime: undefined,
      emergencyContact: undefined,
    });
    expect(mocks.createHoliday).not.toHaveBeenCalled();
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it('deletes the existing holiday and notifies the parent only after success', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    let finishDelete!: () => void;
    mocks.deleteHoliday.mockReturnValueOnce(new Promise<void>((resolve) => { finishDelete = resolve; }));
    render(<HolidayForm open holiday={holiday} clinicId={7} onClose={vi.fn()} onSaved={onSaved} />);

    await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));

    expect(mocks.deleteHoliday).toHaveBeenCalledWith(7, 3);
    expect(onSaved).not.toHaveBeenCalled();
    await act(async () => { finishDelete(); });
    expect(onSaved).toHaveBeenCalledOnce();
  });
});

describe('clinic staff page', () => {
  it('loads and displays clinic staff without calling the system-admin endpoint', async () => {
    mocks.getClinicStaff.mockResolvedValue([{ ...admin, id: 9, firstName: 'Sam', roles: ['DENTIST'] }]);
    mocks.getAllUsers.mockResolvedValue([]);
    render(<UserManagementPage userRole="CLINIC_ADMIN" clinicId="7" />);

    expect(await screen.findByRole('heading', { name: 'Sam Lee' })).toBeInTheDocument();
    expect(mocks.getClinicStaff).toHaveBeenCalledWith(7);
    expect(mocks.getAllUsers).not.toHaveBeenCalled();
  });
});
