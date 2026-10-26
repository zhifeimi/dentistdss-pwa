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
  Refresh as RefreshIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import api from '../../../services';
import { WorkingHours } from '../../../types';
import WorkingHoursForm from './components/WorkingHoursForm';
import WeeklyScheduleView from './components/WeeklyScheduleView';
import {
  getResponsivePadding,
  getResponsiveMargin
} from '../../../utils/mobileOptimization';

interface WorkingHoursPageProps {
  clinicId?: number;
}

/**
 * WorkingHoursPage - Working hours management interface for clinic administrators
 *
 * Features:
 * - View clinic working hours in weekly schedule format
 * - Add new working hours for specific days
 * - Edit existing working hours
 * - Configure break times and emergency hours
 * - Role-based access control for CLINIC_ADMIN
 * - Responsive design with mobile optimization
 * - Dark mode support
 */
const WorkingHoursPage: React.FC<WorkingHoursPageProps> = ({ clinicId }) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [selectedWorkingHours, setSelectedWorkingHours] = useState<WorkingHours | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Get clinic ID from props or current user
  const effectiveClinicId = clinicId || currentUser?.clinicId;

  // Check if user has CLINIC_ADMIN role
  const hasAdminAccess = currentUser?.roles?.includes('CLINIC_ADMIN');

  // Load working hours data
  const loadWorkingHours = async (showRefreshing = false) => {
    if (!effectiveClinicId) {
      setError('No clinic ID available');
      setLoading(false);
      return;
    }

    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const workingHoursData = await api.clinic.getClinicWorkingHours(effectiveClinicId);
      setWorkingHours(workingHoursData);
      setError('');
    } catch (err: any) {
      console.error('Error loading working hours:', err);
      setError(err.message || 'Failed to load working hours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadWorkingHours();
  }, [effectiveClinicId]);

  // Handle working hours creation/update
  const handleWorkingHoursSaved = async () => {
    setOpenForm(false);
    setSelectedWorkingHours(null);
    await loadWorkingHours(true);
  };

  // Handle add new working hours
  const handleAddWorkingHours = () => {
    setSelectedWorkingHours(null);
    setOpenForm(true);
  };

  // Handle edit working hours
  const handleEditWorkingHours = (workingHour: WorkingHours) => {
    setSelectedWorkingHours(workingHour);
    setOpenForm(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadWorkingHours(true);
  };

  // Get summary statistics
  const getSummaryStats = () => {
    const totalDays = workingHours.length;
    const openDays = workingHours.filter(wh => !wh.isClosed).length;
    const emergencyHours = workingHours.filter(wh => wh.isEmergencyHours).length;
    const withBreaks = workingHours.filter(wh => wh.hasBreakTime).length;

    return { totalDays, openDays, emergencyHours, withBreaks };
  };

  const stats = getSummaryStats();

  // Access control check
  if (!hasAdminAccess) {
    return (
      <Box sx={{ p: getResponsivePadding(isSmallMobile ? 'small' : 'medium') }}>
        <Alert severity="error">
          Access denied. Only clinic administrators can manage working hours.
        </Alert>
      </Box>
    );
  }

  const header = (
    <PageHeader
      title="Opening hours"
      description="The hours patients can book at your clinic, day by day."
      actions={
        <>
          <Tooltip title="Refresh working hours">
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
              onClick={handleAddWorkingHours}
              sx={{ minWidth: 160 }}
            >
              Add hours
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
          <CircularProgress aria-label="Loading opening hours" />
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

      {/* Summary Statistics */}
      <Card
        sx={{
          mb: getResponsiveMargin(isSmallMobile ? 'small' : 'medium'),
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BusinessIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Summary
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.totalDays}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Schedules
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.openDays}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Open days
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.emergencyHours}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Emergency hours
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.withBreaks}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  With breaks
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Weekly Schedule View */}
      <WeeklyScheduleView
        workingHours={workingHours}
        onEditWorkingHours={handleEditWorkingHours}
        loading={refreshing}
      />

      {/* Mobile FAB for Add Working Hours */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add working hours"
          onClick={handleAddWorkingHours}
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

      {/* Working Hours Form Dialog */}
      <WorkingHoursForm
        open={openForm}
        workingHours={selectedWorkingHours}
        clinicId={effectiveClinicId!}
        onClose={() => {
          setOpenForm(false);
          setSelectedWorkingHours(null);
        }}
        onSaved={handleWorkingHoursSaved}
      />
    </Box>
  );
};

export default WorkingHoursPage;
