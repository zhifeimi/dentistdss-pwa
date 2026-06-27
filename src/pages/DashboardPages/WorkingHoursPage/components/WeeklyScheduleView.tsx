import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  Emergency as EmergencyIcon,
  Coffee as CoffeeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { WorkingHours, DayOfWeek } from '../../../../types';

interface WeeklyScheduleViewProps {
  workingHours: WorkingHours[];
  onEditWorkingHours: (workingHours: WorkingHours) => void;
  loading?: boolean;
}

interface DayScheduleCardProps {
  day: DayOfWeek;
  workingHours: WorkingHours[];
  onEdit: (workingHours: WorkingHours) => void;
}

// Day order for display
const dayOrder: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY', 
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

// Day display names
const dayDisplayNames: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

/**
 * DayScheduleCard - Individual day schedule display card
 */
const DayScheduleCard: React.FC<DayScheduleCardProps> = ({ day, workingHours, onEdit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get working hours for this day
  const dayWorkingHours = workingHours.filter(wh => wh.dayOfWeek === day);
  const regularHours = dayWorkingHours.filter(wh => !wh.specificDate);
  const specificDateHours = dayWorkingHours.filter(wh => wh.specificDate);

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderWorkingHoursItem = (wh: WorkingHours, isSpecific = false) => (
    <Box 
      key={wh.id} 
      sx={{ 
        p: 2, 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mb: 1,
        backgroundColor: isSpecific 
          ? theme.palette.action.hover 
          : 'transparent',
        position: 'relative'
      }}
    >
      {/* Header with edit button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          {isSpecific && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                {formatDate(wh.specificDate!)}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {wh.isClosed ? (
              <Chip 
                label="Closed" 
                color="error" 
                size="small"
                icon={<CloseIcon />}
              />
            ) : (
              <Chip 
                label={`${formatTime(wh.openingTime)} - ${formatTime(wh.closingTime)}`}
                color="success" 
                size="small"
                icon={<AccessTimeIcon />}
              />
            )}
            
            {wh.isEmergencyHours && (
              <Chip 
                label="Emergency" 
                color="warning" 
                size="small"
                icon={<EmergencyIcon />}
              />
            )}
            
            {wh.hasBreakTime && !wh.isClosed && (
              <Chip 
                label="Break" 
                color="info" 
                size="small"
                icon={<CoffeeIcon />}
              />
            )}
          </Box>
        </Box>

        <Tooltip title="Edit working hours">
          <IconButton 
            onClick={() => onEdit(wh)}
            color="primary"
            size="small"
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Break time details */}
      {wh.hasBreakTime && !wh.isClosed && wh.breakStartTime && wh.breakEndTime && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Break: {formatTime(wh.breakStartTime)} - {formatTime(wh.breakEndTime)}
          </Typography>
        </Box>
      )}

      {/* Notes */}
      {wh.notes && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {wh.notes}
          </Typography>
        </Box>
      )}

      {/* Schedule type */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {wh.displaySchedule}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {dayDisplayNames[day]}
          </Typography>
        </Box>

        {/* Regular working hours */}
        {regularHours.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Regular Hours
            </Typography>
            {regularHours.map(wh => renderWorkingHoursItem(wh, false))}
          </Box>
        )}

        {/* Specific date overrides */}
        {specificDateHours.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {regularHours.length > 0 && <Divider sx={{ mb: 2 }} />}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Specific Dates
            </Typography>
            {specificDateHours.map(wh => renderWorkingHoursItem(wh, true))}
          </Box>
        )}

        {/* No working hours */}
        {dayWorkingHours.length === 0 && (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              No working hours configured
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * WeeklyScheduleView - Weekly schedule view component
 *
 * Features:
 * - Displays working hours for each day of the week
 * - Shows regular hours and specific date overrides
 * - Edit functionality for each working hours entry
 * - Loading states with skeletons
 * - Responsive design
 * - Visual indicators for different schedule types
 */
const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({ 
  workingHours, 
  onEditWorkingHours, 
  loading = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Loading skeleton
  if (loading) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Weekly Schedule
        </Typography>
        
        <Grid container spacing={2}>
          {dayOrder.map((day) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={day}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="60%" height={32} />
                  </Box>
                  <Skeleton variant="rectangular" height={80} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Weekly Schedule
      </Typography>
      
      <Grid container spacing={2}>
        {dayOrder.map((day) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={day}>
            <DayScheduleCard
              day={day}
              workingHours={workingHours}
              onEdit={onEditWorkingHours}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WeeklyScheduleView;
