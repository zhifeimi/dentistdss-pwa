import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkingHoursPage from '../index';
import { useAuth } from '../../../../context/auth';

// Mock the API
vi.mock('../../../../services', () => ({
  default: {
    clinic: {
      getClinicWorkingHours: vi.fn().mockResolvedValue([]),
      createWorkingHours: vi.fn().mockResolvedValue({}),
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

describe('WorkingHoursPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(createAuthValue());
  });

  it('renders working hours page for clinic admin', async () => {
    renderWithProviders(<WorkingHoursPage />);

    // Check if the main heading is present
    expect(await screen.findByText('Working Hours Management')).toBeInTheDocument();

    // Check if the schedule overview is present
    await waitFor(() => {
      expect(screen.getByText('Schedule Overview')).toBeInTheDocument();
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
            <WorkingHoursPage />
          </LocalizationProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Access denied/)).toBeInTheDocument();
    expect(screen.getByText(/Only clinic administrators can manage working hours/)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<WorkingHoursPage />);

    // Should show loading spinner initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays weekly schedule view after loading', async () => {
    renderWithProviders(<WorkingHoursPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
    });

    // Check if all days of the week are displayed
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });
});
