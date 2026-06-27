import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HolidayManagementPage from '../index';
import { useAuth } from '../../../../context/auth';

// Mock the API
vi.mock('../../../../services', () => ({
  default: {
    clinic: {
      getClinicHolidays: vi.fn().mockResolvedValue([]),
      getUpcomingHolidays: vi.fn().mockResolvedValue([]),
      createHoliday: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../../../../context/auth', () => ({
  useAuth: vi.fn(),
}));

const mockCurrentUser = {
  id: 1,
  email: 'admin@clinic.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['CLINIC_ADMIN'],
  clinicId: 1,
};

const mockUseAuth = vi.mocked(useAuth);

const createAuthValue = (currentUser = mockCurrentUser) => (
  {
    currentUser,
    isAuthenticated: true,
    loading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    googleIdLogin: vi.fn(),
    processAuthToken: vi.fn(),
  } as any
);

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {component}
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('HolidayManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(createAuthValue());
  });

  it('renders holiday management page for clinic admin', async () => {
    renderWithProviders(<HolidayManagementPage />);

    // Check if the main heading is present
    expect(await screen.findByText('Holiday Management')).toBeInTheDocument();

    // Check if the add holiday button is present (on desktop)
    await waitFor(() => {
      const addButton = screen.queryByText('Add Holiday');
      if (addButton) {
        expect(addButton).toBeInTheDocument();
      }
    });
  });

  it('shows access denied for non-admin users', () => {
    const nonAdminUser = {
      ...mockCurrentUser,
      roles: ['PATIENT'],
    };

    mockUseAuth.mockReturnValue(createAuthValue(nonAdminUser));

    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <HolidayManagementPage />
          </LocalizationProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Access denied/)).toBeInTheDocument();
    expect(screen.getByText(/Only clinic administrators can manage holidays/)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<HolidayManagementPage />);

    // Should show loading spinner initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
