import React from 'react';
import { Grid, Box, Button, useTheme } from '@mui/material';
import dayjs from '../../../../utils/dayjs';
import {
  generateCalendarDays,
  isDateSelectable,
  isDateSelected,
  WEEK_DAYS
} from './utils';
import type { CalendarGridProps } from './types';

/**
 * CalendarGrid component
 * Renders the calendar grid with days
 */
export const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarDate,
  value,
  minDate,
  maxDate,
  onDateSelect,
}) => {
  const theme = useTheme();
  const calendarDays = generateCalendarDays(calendarDate);

  return (
    <>
      {/* Weekday Headers */}
      <Grid container spacing={0} sx={{ mb: 1 }}>
        {WEEK_DAYS.map((day) => (
          <Grid size={{ xs: 12/7 }} key={day}>
            <Box sx={{
              textAlign: 'center',
              py: 1,
              fontSize: '0.75rem',
              fontWeight: 'medium',
              color: 'text.secondary'
            }}>
              {day}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Days */}
      <Grid container spacing={0}>
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.month() === calendarDate.month();
          const isToday = day.isSame(dayjs(), 'day');
          const isSelected = isDateSelected(day.toDate(), value);
          const isSelectable = isDateSelectable(day.toDate(), minDate, maxDate);
          
          return (
            <Grid size={{ xs: 12/7 }} key={index}>
              <Button
                size="small"
                onClick={() => onDateSelect(day.toDate())}
                disabled={!isSelectable}
                sx={{
                  minWidth: 36,
                  height: 36,
                  p: 0,
                  borderRadius: 1,
                  color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                  backgroundColor: isSelected ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
                  },
                  '&.Mui-disabled': {
                    color: 'text.disabled',
                  },
                  ...(isToday && !isSelected && {
                    border: `1px solid ${theme.palette.primary.main}`,
                  }),
                  ...(isSelected && {
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }),
                }}
              >
                {day.date()}
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};
