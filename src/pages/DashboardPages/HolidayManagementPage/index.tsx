import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Fab,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import api from '../../../services';
import { Holiday } from '../../../types';
import HolidayForm from './components/HolidayForm';
import HolidayList from './components/HolidayList';
import {
  getResponsivePadding,
  getResponsiveMargin
} from '../../../utils/mobileOptimization';

interface HolidayManagementPageProps {
  clinicId?: number;
}

/**
 * HolidayManagementPage - Holiday management interface for clinic administrators
 *
 * Features:
 * - View all clinic holidays in list and calendar format
 * - Add new holidays with comprehensive form
 * - Edit existing holidays
 * - View upcoming holidays
 * - Role-based access control for CLINIC_ADMIN
 * - Responsive design with mobile optimization
 * - Dark mode support
 */
const HolidayManagementPage: React.FC<HolidayManagementPageProps> = ({ clinicId }) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Get clinic ID from props or current user
  const effectiveClinicId = clinicId || currentUser?.clinicId;

  // Check if user has CLINIC_ADMIN role
  const hasAdminAccess = currentUser?.roles?.includes('CLINIC_ADMIN');

  // Load holidays data
  const loadHolidays = async (showRefreshing = false) => {
    if (!effectiveClinicId) {
      setError('No clinic ID available');
      setLoading(false);
      return;
    }

    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [holidaysData, upcomingData] = await Promise.all([
        api.clinic.getClinicHolidays(effectiveClinicId),
        api.clinic.getUpcomingHolidays(effectiveClinicId)
      ]);

      setHolidays(holidaysData);
      setUpcomingHolidays(upcomingData);
      setError('');
    } catch (err: any) {
      console.error('Error loading holidays:', err);
      setError(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadHolidays();
  }, [effectiveClinicId]);

  // Handle holiday creation/update
  const handleHolidaySaved = async () => {
    setOpenForm(false);
    setSelectedHoliday(null);
    await loadHolidays(true);
  };

  // Handle add new holiday
  const handleAddHoliday = () => {
    setSelectedHoliday(null);
    setOpenForm(true);
  };

  // Handle edit holiday
  const handleEditHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setOpenForm(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadHolidays(true);
  };

  // Access control check
  if (!hasAdminAccess) {
    return (
      <Box sx={{ p: getResponsivePadding(isSmallMobile ? 'small' : 'medium') }}>
        <Alert severity="error">
          Access denied. Only clinic administrators can manage holidays.
        </Alert>
      </Box>
    );
  }

  const header = (
    <PageHeader
      title="Holidays and closures"
      description="Days your clinic is closed. Patients can't book on these days."
      actions={
        <>
          <Tooltip title="Refresh holidays">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddHoliday}
              sx={{ minWidth: 140 }}
            >
              Add holiday
            </Button>
          )}
        </>
      }
    />
  );

  // Loading state
  if (loading) {
    return (
      <Box>
        {header}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading holidays" />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {header}

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: getResponsiveMargin(isSmallMobile ? 'small' : 'medium') }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Upcoming Holidays Summary */}
      {upcomingHolidays.length > 0 && (
        <Card
          sx={{
            mb: getResponsiveMargin(isSmallMobile ? 'small' : 'medium'),
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EventIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Upcoming holidays ({upcomingHolidays.length})
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {upcomingHolidays.slice(0, 3).map((holiday) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={holiday.id}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {holiday.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {new Date(holiday.holidayDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {holiday.daysUntilHoliday} days away
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Holiday List */}
      <HolidayList
        holidays={holidays}
        onEditHoliday={handleEditHoliday}
        loading={refreshing}
      />

      {/* Mobile FAB for Add Holiday */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add holiday"
          onClick={handleAddHoliday}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Holiday Form Dialog */}
      <HolidayForm
        open={openForm}
        holiday={selectedHoliday}
        clinicId={effectiveClinicId!}
        onClose={() => {
          setOpenForm(false);
          setSelectedHoliday(null);
        }}
        onSaved={handleHolidaySaved}
      />
    </Box>
  );
};

export default HolidayManagementPage;
