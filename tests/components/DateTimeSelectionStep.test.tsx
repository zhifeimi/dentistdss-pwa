import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DateTimeSelectionStep from '../../src/components/Dashboard/shared/BookingWizard/steps/DateTimeSelectionStep';

const renderStep = (overrides = {}) => {
  const onSelectDate = vi.fn();
  const onSelectTime = vi.fn();
  const onSelectDentist = vi.fn();

  render(
    <DateTimeSelectionStep
      selectedClinic='7'
      selectedDate='2026-08-01'
      selectedTime=''
      selectedDentist='84'
      dentists={[]}
      availableSlots={[]}
      onSelectDate={onSelectDate}
      onSelectTime={onSelectTime}
      onSelectDentist={onSelectDentist}
      errors={{}}
      loading={false}
      {...overrides}
    />,
  );

  return { onSelectDate, onSelectTime, onSelectDentist };
};

describe('DateTimeSelectionStep', () => {
  it('shows a slot-loading failure instead of an empty-availability message', () => {
    renderStep({
      errors: { slots: 'Failed to load available time slots' },
    });

    expect(screen.getByText('Failed to load available time slots')).toBeInTheDocument();
    expect(
      screen.queryByText('No available time slots found for the selected date and dentist.'),
    ).not.toBeInTheDocument();
  });

  it('returns the complete authoritative interval when a slot is selected', async () => {
    const user = userEvent.setup();
    const { onSelectTime } = renderStep({
      availableSlots: [{ startTime: '10:00:00', endTime: '10:45:00' }],
    });

    await user.click(screen.getByRole('button', { name: '10:00 AM' }));

    expect(onSelectTime).toHaveBeenCalledWith('10:00:00', '10:45:00');
  });
});
