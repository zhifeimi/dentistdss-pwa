import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OverviewPage from '../../src/pages/DashboardPages/OverviewPage';

const mocks = vi.hoisted(() => ({
  getDentistAppointments: vi.fn(),
}));

vi.mock('../../src/services', () => ({
  default: {
    appointment: { getDentistAppointments: mocks.getDentistAppointments },
  },
}));

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({ currentUser: { id: 2, firstName: 'Jane', lastName: 'Smith', roles: ['DENTIST'] } }),
}));

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.getDentistAppointments.mockReset();
  });

  it("says the appointments didn't load instead of showing an empty day, and retries", async () => {
    mocks.getDentistAppointments.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce([]);
    render(<OverviewPage userRole="DENTIST" />);

    expect(await screen.findByText(/Couldn't load your appointments/)).toBeInTheDocument();
    expect(screen.queryByText('No appointments today')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('No appointments today')).toBeInTheDocument();
    expect(screen.queryByText(/Couldn't load your appointments/)).not.toBeInTheDocument();
  });
});
