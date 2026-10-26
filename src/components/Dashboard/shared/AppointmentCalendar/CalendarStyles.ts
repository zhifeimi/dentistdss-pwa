import { alpha } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { getStatusColor } from '../../../../utils/dashboard/dashboardUtils';

/**
 * Calendar styling utilities
 * Extracted to follow Single Responsibility Principle
 */

/**
 * Get event styles based on appointment status
 */
export const getEventStyle = (status: string, isMobile: boolean, theme: Theme) => {
  // getStatusColor returns a palette key, not a CSS colour
  const tone = getStatusColor(status);
  const palette = theme.palette[tone === 'default' ? 'primary' : tone];
  return {
    style: {
      backgroundColor: palette.main,
      color: palette.contrastText,
      border: 'none',
      borderRadius: '4px',
      fontSize: isMobile ? '12px' : '14px',
      padding: '2px 4px',
    },
  };
};

/**
 * Get calendar paper styles
 */
export const getCalendarPaperStyles = (theme: Theme, height: number) => ({
  p: 2,
  height: height,
  '& .rbc-calendar': {
    height: '100%',
  },
  // Custom styles for react-big-calendar
  // Grid hairlines in the theme divider colour (the library default is #ddd)
  [[
    '.rbc-month-view', '.rbc-time-view', '.rbc-agenda-view', '.rbc-header', '.rbc-header + .rbc-header',
    '.rbc-day-bg + .rbc-day-bg', '.rbc-month-row + .rbc-month-row', '.rbc-time-header-content',
    '.rbc-time-content', '.rbc-time-content > * + * > *', '.rbc-timeslot-group', '.rbc-day-slot .rbc-time-slot',
    '.rbc-agenda-view table.rbc-agenda-table', '.rbc-agenda-view table.rbc-agenda-table tbody > tr > td + td',
    '.rbc-agenda-view table.rbc-agenda-table tbody > tr + tr', '.rbc-agenda-view table.rbc-agenda-table thead > tr > th',
  ].map((selector) => `& ${selector}`).join(', ')]: {
    borderColor: theme.palette.divider,
  },
  '& .rbc-header': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    fontWeight: 'medium',
  },
  '& .rbc-today': {
    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
  },
  '& .rbc-off-range-bg': {
    backgroundColor: theme.palette.background.default,
  },
  '& .rbc-event': {
    borderRadius: theme.shape.borderRadius,
    border: 'none',
  },
  '& .rbc-event:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  '& .rbc-slot-selection': {
    backgroundColor: alpha(theme.palette.primary.main, 0.16),
  },
  '& .rbc-toolbar': {
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  '& .rbc-toolbar button': {
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: 'transparent',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.rbc-active': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.main,
    },
  },
});
