import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Phone as PhoneIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import { Holiday, HolidayType } from '../../../../types';
import EmptyState from '../../../../components/Dashboard/shared/EmptyState';

interface HolidayListProps {
  holidays: Holiday[];
  onEditHoliday: (holiday: Holiday) => void;
  loading?: boolean;
}

interface HolidayCardProps {
  holiday: Holiday;
  onEdit: (holiday: Holiday) => void;
}

// Holiday type color mapping
const getHolidayTypeColor = (type: HolidayType): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (type) {
    case 'NATIONAL_HOLIDAY':
      return 'primary';
    case 'CLINIC_CLOSURE':
      return 'error';
    case 'STAFF_TRAINING':
      return 'info';
    case 'MAINTENANCE':
      return 'warning';
    case 'EMERGENCY_CLOSURE':
      return 'error';
    case 'VACATION':
      return 'success';
    case 'OTHER':
    default:
      return 'default';
  }
};

/**
 * HolidayCard - Individual holiday display card
 */
const HolidayCard: React.FC<HolidayCardProps> = ({ holiday, onEdit }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card
      variant="outlined"
      sx={{ mb: 2, borderColor: holiday.isUpcoming ? 'primary.main' : 'divider' }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                {holiday.name}
              </Typography>
              {holiday.isUpcoming && (
                <Chip 
                  label={`${holiday.daysUntilHoliday} days`} 
                  color="primary" 
                  size="small"
                  icon={<EventIcon />}
                />
              )}
              {holiday.isRecurring && (
                <Chip 
                  label="Recurring" 
                  variant="outlined"
                  size="small"
                  icon={<RepeatIcon />}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip 
                label={holiday.typeDisplayName || holiday.type}
                color={getHolidayTypeColor(holiday.type)}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {formatDate(holiday.holidayDate)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Edit holiday">
              <IconButton 
                onClick={() => onEdit(holiday)}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={expanded ? "Show less" : "Show more"}>
              <IconButton 
                onClick={handleExpandClick}
                size="small"
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Closure Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ScheduleIcon color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {holiday.isFullDayClosure ? (
              'Full day closure'
            ) : (
              `Special hours: ${holiday.specialOpeningTime ? formatTime(holiday.specialOpeningTime) : 'N/A'} - ${holiday.specialClosingTime ? formatTime(holiday.specialClosingTime) : 'N/A'}`
            )}
          </Typography>
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          
          {/* Description */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {holiday.description}
            </Typography>
          </Box>

          {/* Emergency Contact */}
          {holiday.emergencyContact && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Emergency contact
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {holiday.emergencyContact}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Additional Info */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(holiday.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            {holiday.updatedAt !== holiday.createdAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(holiday.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

/**
 * HolidayList - List component for displaying holidays
 *
 * Features:
 * - Displays holidays in card format
 * - Expandable cards for detailed information
 * - Edit functionality for each holiday
 * - Loading states with skeletons
 * - Responsive design
 * - Visual indicators for upcoming holidays
 */
const HolidayList: React.FC<HolidayListProps> = ({ holidays, onEditHoliday, loading = false }) => {

  // Loading skeleton
  if (loading) {
    return (
      <Box>
        {[...Array(3)].map((_, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="circular" width={40} height={40} />
                </Box>
              </Box>
              <Skeleton variant="text" width="80%" height={20} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Empty state
  if (holidays.length === 0) {
    return (
      <EmptyState title="No holidays yet">
        Add public holidays and planned closures so patients can't book those days.
      </EmptyState>
    );
  }

  // Sort holidays by date (upcoming first, then by date)
  const sortedHolidays = [...holidays].sort((a, b) => {
    // Upcoming holidays first
    if (a.isUpcoming && !b.isUpcoming) return -1;
    if (!a.isUpcoming && b.isUpcoming) return 1;
    
    // Then by date
    return new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime();
  });

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        All holidays ({holidays.length})
      </Typography>
      
      {sortedHolidays.map((holiday) => (
        <HolidayCard
          key={holiday.id}
          holiday={holiday}
          onEdit={onEditHoliday}
        />
      ))}
    </Box>
  );
};

export default HolidayList;
