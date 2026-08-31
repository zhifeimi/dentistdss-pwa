import { Theme } from '@mui/material/styles';
import dayjs from '../../../../utils/dayjs';

/**
 * Calendar styling utilities
 * Extracted to follow Single Responsibility Principle
 */

/**
 * Get event styles based on selection state
 */
export const getEventStyle = (isSelected: boolean, theme: Theme) => ({
  style: {
    backgroundColor: isSelected 
      ? theme.palette.primary.main 
      : theme.palette.success.light,
    borderColor: isSelected 
      ? theme.palette.primary.dark 
      : theme.palette.success.main,
    color: theme.palette.common.white,
    border: `2px solid ${isSelected 
      ? theme.palette.primary.dark 
      : theme.palette.success.main}`,
    borderRadius: theme.shape.borderRadius,
    fontSize: '12px',
    fontWeight: isSelected ? 'bold' : 'normal',
    cursor: 'pointer',
    opacity: 1,
  }
});

/**
 * Get calendar paper styles
 */
export const getCalendarPaperStyles = (theme: Theme, isMobile: boolean) => ({
  p: 2,
  height: isMobile ? 600 : 700,
  '& .rbc-calendar': {
    height: '100%',
  },
  // Custom styles for react-big-calendar
  '& .rbc-header': {
    backgroundColor: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    fontWeight: 'medium',
  },
  '& .rbc-today': {
    backgroundColor: theme.palette.primary.light + '20',
  },
  '& .rbc-off-range-bg': {
    backgroundColor: theme.palette.grey[100],
  },
  '& .rbc-event': {
    borderRadius: theme.shape.borderRadius,
  },
  '& .rbc-event:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  // Dark mode support
  ...(theme.palette.mode === 'dark' && {
    '& .rbc-header': {
      backgroundColor: theme.palette.grey[800],
      color: theme.palette.common.white,
    },
    '& .rbc-off-range-bg': {
      backgroundColor: theme.palette.grey[900],
    },
    '& .rbc-today': {
      backgroundColor: theme.palette.primary.dark + '30',
    },
  }),
});

/**
 * Get calendar formats configuration
 */
export const getCalendarFormats = (isMobile: boolean) => ({
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
    return `${dayjs(start).format('HH:mm')} - ${dayjs(end).format('HH:mm')}`;
  },
  dayHeaderFormat: isMobile ? 'ddd M/D' : 'dddd, MMMM D',
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => {
    return `${dayjs(start).format('MMM D')} - ${dayjs(end).format('MMM D, YYYY')}`;
  },
});

/**
 * Get calendar messages configuration
 */
export const getCalendarMessages = () => ({
  noEventsInRange: 'No available time slots in this range.',
  showMore: (total: number) => `+${total} more`,
});
