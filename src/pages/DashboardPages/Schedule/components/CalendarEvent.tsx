import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { Block as BlockIcon, CheckCircle as ActiveIcon } from '@mui/icons-material';
import type { CalendarEventProps } from '../../../../types/components';

/**
 * Custom event component for react-big-calendar
 * Displays availability slots with proper styling and status indicators
 */
const CalendarEvent: React.FC<CalendarEventProps> = ({ event }) => {
  const slot = event.resource;

  /**
   * Get status icon based on slot state
   */
  const getStatusIcon = (): ReactNode => {
    if (slot.isBlocked) {
      return <BlockIcon sx={{ fontSize: 12, mr: 0.5 }} />;
    }
    if (slot.isActive) {
      return <ActiveIcon sx={{ fontSize: 12, mr: 0.5 }} />;
    }
    return null;
  };

  /**
   * Get status text
   */
  const getStatusText = (): string => {
    if (slot.isBlocked) return 'Blocked';
    if (slot.isActive) return 'Available';
    return 'Inactive';
  };

  /**
   * Get abbreviated title for small views
   */
  const getAbbreviatedTitle = (): string => {
    const [startTime, endTime] = event.title.split(' - ');
    return `${startTime.replace(' AM', 'a').replace(' PM', 'p')} - ${endTime.replace(' AM', 'a').replace(' PM', 'p')}`;
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '2px 4px',
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.8,
          transform: 'scale(1.02)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      {/* Time Range */}
      <Typography
        variant="caption"
        sx={{
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1.2,
          color: 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}
      >
        {window.innerWidth < 768 ? getAbbreviatedTitle() : event.title}
      </Typography>

      {/* Status Indicator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mt: 0.25,
          minHeight: '14px'
        }}
      >
        {getStatusIcon()}
        <Typography
          variant="caption"
          sx={{
            fontSize: '10px',
            color: 'inherit',
            opacity: 0.9,
            whiteSpace: 'nowrap'
          }}
        >
          {getStatusText()}
        </Typography>
      </Box>

      {/* Recurring Indicator */}
      {slot.isRecurring && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '9px',
            color: 'inherit',
            opacity: 0.7,
            fontStyle: 'italic',
            lineHeight: 1
          }}
        >
          Recurring
        </Typography>
      )}
    </Box>
  );
};

export default CalendarEvent;
