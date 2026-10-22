import React from 'react';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import useAppointments from '../../src/hooks/appointment/useAppointments';
import OverviewPage from '../../src/pages/DashboardPages/OverviewPage';
import PatientInfoStep from '../../src/components/Dashboard/shared/BookingWizard/steps/PatientInfoStep';
import { DateTimeSection } from '../../src/components/Dashboard/shared/AppointmentDialog/DateTimeSection';

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

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
  unobserve() {}
});

// Stand-in picker: shows the Date it was given and picks local midnight 2026-10-22
vi.mock('../../src/components/Dashboard/shared/CalendarDatePicker', () => ({
  default: ({ label, value, onChange }: { label: string; value: Date | null; onChange: (date: Date) => void }) => (
    <button type="button" aria-label={label} data-value={value ? value.toDateString() : ''} onClick={() => onChange(new Date(2026, 9, 22))} />
  ),
}));

// Each instant falls on a different calendar day locally than in UTC
describe.each([
  { timeZone: 'Australia/Sydney', now: '2026-10-21T21:00:00Z', today: '2026-10-22' },
  { timeZone: 'America/New_York', now: '2026-10-22T02:00:00Z', today: '2026-10-21' },
])('local calendar dates in $timeZone', ({ timeZone, now, today }) => {
  const originalTimeZone = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = timeZone;
  });
  afterAll(() => {
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
  });
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(now));
    mocks.getDentistAppointments.mockReset().mockResolvedValue([{ id: 1, appointmentDate: today }]);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('useAppointments fetches and filters by the local today', async () => {
    const { result } = renderHook(() => useAppointments(null, 'DENTIST'));

    await waitFor(() => expect(result.current.appointments).toHaveLength(1));
    expect(mocks.getDentistAppointments).toHaveBeenCalledWith(2, today);
    expect(result.current.todaysAppointments).toHaveLength(1);
    expect(result.current.upcomingAppointments).toHaveLength(1);
  });

  test("OverviewPage loads the dentist's appointments for the local today", async () => {
    render(<OverviewPage userRole="DENTIST" />);

    await waitFor(() => expect(mocks.getDentistAppointments).toHaveBeenCalledWith(2, today));
  });

  test('PatientInfoStep stores and shows the picked date of birth', async () => {
    const onUpdatePatientData = vi.fn();
    render(<PatientInfoStep patientData={{ dateOfBirth: '2026-10-22' }} onUpdatePatientData={onUpdatePatientData} errors={{}} />);

    const picker = screen.getByRole('button', { name: 'Date of Birth' });
    expect(picker).toHaveAttribute('data-value', new Date(2026, 9, 22).toDateString());
    await userEvent.click(picker);
    expect(onUpdatePatientData).toHaveBeenCalledWith('dateOfBirth', '2026-10-22');
  });

  test('DateTimeSection stores and shows the rescheduled date', async () => {
    const onFieldChange = vi.fn();
    render(
      <DateTimeSection
        appointment={{ id: 1 } as never}
        mode="reschedule"
        editData={{ date: '2026-10-22' } as never}
        errors={{}}
        onFieldChange={onFieldChange}
      />,
    );

    const picker = screen.getByRole('button', { name: 'Date' });
    expect(picker).toHaveAttribute('data-value', new Date(2026, 9, 22).toDateString());
    await userEvent.click(picker);
    expect(onFieldChange).toHaveBeenCalledWith('date', '2026-10-22');
  });
});
