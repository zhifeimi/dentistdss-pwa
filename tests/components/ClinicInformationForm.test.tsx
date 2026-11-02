import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClinicInformationForm from '../../src/pages/DashboardPages/SettingsPage/components/ClinicInformationForm';
import api from '../../src/services';

vi.unmock('react-router');
vi.mock('../../src/context/auth', () => ({ useAuth: () => ({ currentUser: { clinicId: 7 } }) }));
vi.mock('../../src/services', () => ({ default: { clinic: { updateClinic: vi.fn() } } }));

const updateClinic = vi.mocked(api.clinic.updateClinic);

const clinic = {
  id: 7,
  name: 'Harbourside Dental',
  address: '12 Miller Street',
  city: 'North Sydney',
  state: 'New South Wales',
  zipCode: '2060',
  country: 'Australia',
  phoneNumber: '+61 2 9000 0001',
  email: 'hello@harbourside.example',
  isActive: true,
  slug: 'harbourside-dental-north-sydney',
  listedPublicly: true,
  description: 'Family dental clinic.',
  website: 'https://harbourside.example',
} as any;

const renderForm = (data = clinic) =>
  render(<MemoryRouter><ClinicInformationForm clinicData={data} /></MemoryRouter>);

describe('clinic settings: public listing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The multiline description field constructs a ResizeObserver; the global
    // test mock is a plain function.
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    updateClinic.mockImplementation(async (_id, updates) => ({ ...clinic, ...updates }));
  });

  it('shows the listing state and links to the public page', () => {
    renderForm();

    expect(screen.getByRole('switch', { name: 'List my clinic in the public directory' })).toBeChecked();
    expect(screen.getByRole('link', { name: 'View your public page' }))
      .toHaveAttribute('href', '/dentists/nsw/north-sydney/harbourside-dental-north-sydney');
    expect(screen.getByLabelText('Description')).toHaveValue('Family dental clinic.');
  });

  it('has no public page link before the clinic is listed', () => {
    renderForm({ ...clinic, listedPublicly: false });
    expect(screen.queryByRole('link', { name: 'View your public page' })).not.toBeInTheDocument();
  });

  it('saves the description, website and listing choice', async () => {
    renderForm({ ...clinic, listedPublicly: false });
    fireEvent.click(screen.getByRole('switch', { name: 'List my clinic in the public directory' }));
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: '  Early starts on weekdays.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateClinic).toHaveBeenCalledTimes(1));
    expect(updateClinic).toHaveBeenCalledWith(7, expect.objectContaining({
      description: 'Early starts on weekdays.',
      website: 'https://harbourside.example',
      listedPublicly: true,
    }));
  });

  it('asks for a full web address', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Website'), { target: { value: 'harbourside.example' } });

    expect(screen.getByText('Enter the full address, starting with https://')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText(/correct the errors/)).toBeInTheDocument());
    expect(updateClinic).not.toHaveBeenCalled();
  });
});
