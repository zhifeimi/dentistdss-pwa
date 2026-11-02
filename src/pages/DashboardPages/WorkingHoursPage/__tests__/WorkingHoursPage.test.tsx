import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkingHoursPage from '../index';
import api from '../../../../services';
import { useAuth } from '../../../../context/auth';

vi.unmock('react-router');

vi.mock('../../../../services', () => ({
  default: {
    clinic: {
      getClinicById: vi.fn(),
      updateClinic: vi.fn(),
    },
  },
}));

vi.mock('../../../../context/auth', () => ({
  useAuth: vi.fn(),
}));

const admin = { id: 1, roles: ['CLINIC_ADMIN'], clinicId: 7 };
const mockUseAuth = vi.mocked(useAuth);
const getClinicById = vi.mocked(api.clinic.getClinicById);
const updateClinic = vi.mocked(api.clinic.updateClinic);

const renderPage = () => render(<MemoryRouter><WorkingHoursPage /></MemoryRouter>);

describe('WorkingHoursPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ currentUser: admin } as any);
    getClinicById.mockResolvedValue({
      id: 7,
      operatingHours: [
        { dayOfWeek: 1, openTime: '08:30', closeTime: '17:00', isOpen: true },
        { dayOfWeek: 6, openTime: '09:00', closeTime: '12:00', isOpen: false },
      ],
    } as any);
    updateClinic.mockImplementation(async (_id, updates) => ({ id: 7, ...updates }) as any);
  });

  it("loads the clinic's hours and lists every day, Monday first", async () => {
    renderPage();

    expect(await screen.findByLabelText('Monday opens')).toHaveValue('08:30');
    expect(screen.getByLabelText('Monday closes')).toHaveValue('17:00');
    expect(screen.getByLabelText('Open on Monday')).toBeChecked();
    expect(screen.getByLabelText('Open on Saturday')).not.toBeChecked();
    expect(screen.getByLabelText('Open on Sunday')).not.toBeChecked();
    expect(getClinicById).toHaveBeenCalledWith(7);
    const days = screen.getAllByRole('listitem').map((item) => item.textContent?.split(/Open|Closed/)[0]);
    expect(days).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  });

  it('saves all seven days on the clinic', async () => {
    renderPage();
    fireEvent.click(await screen.findByLabelText('Open on Tuesday'));
    fireEvent.change(screen.getByLabelText('Tuesday closes'), { target: { value: '18:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save opening hours' }));

    await waitFor(() => expect(updateClinic).toHaveBeenCalledTimes(1));
    const [clinicId, { operatingHours }] = updateClinic.mock.calls[0] as [number, { operatingHours: unknown[] }];
    expect(clinicId).toBe(7);
    expect(operatingHours).toHaveLength(7);
    expect(operatingHours).toContainEqual({ dayOfWeek: 2, openTime: '09:00', closeTime: '18:30', isOpen: true });
    expect(operatingHours).toContainEqual({ dayOfWeek: 1, openTime: '08:30', closeTime: '17:00', isOpen: true });
    expect(operatingHours).toContainEqual({ dayOfWeek: 0, openTime: '09:00', closeTime: '17:00', isOpen: false });
  });

  it('blocks saving when a day closes before it opens', async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText('Monday closes'), { target: { value: '07:00' } });

    expect(screen.getByText('Closing time must be after opening time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save opening hours' })).toBeDisabled();
  });

  it('keeps people without the clinic admin role out', () => {
    mockUseAuth.mockReturnValue({ currentUser: { ...admin, roles: ['PATIENT'] } } as any);
    renderPage();

    expect(screen.getByText(/Only clinic administrators can manage opening hours/)).toBeInTheDocument();
    expect(getClinicById).not.toHaveBeenCalled();
  });
});
