import { alpha, createTheme, Shadows, Theme } from '@mui/material/styles';
import { ThemeMode } from '../../types';

// DentistDSS theme — "scrubs and enamel". Deep surgical green carries every
// action and selection; a gum-pink accent (secondary) marks only what needs
// attention right now; enamel-white surfaces and hairline rules keep dense
// clinic screens calm. One typeface, Atkinson Hyperlegible Next, chosen for
// legibility: anxious patients and staff scanning schedules all day.
const TOKENS = {
  light: {
    background: '#F4F7F6', // enamel
    paper: '#FFFFFF', // porcelain
    primary: '#0B5D52', // scrubs
    primaryLight: '#2F7D70',
    primaryDark: '#07463E',
    primaryContrast: '#FFFFFF',
    accent: '#C23A5B', // gingiva
    accentLight: '#E46A80',
    accentDark: '#9C2645',
    text: '#0F2724', // ink
    textSecondary: '#52645F', // steel
    divider: '#DCE4E1',
    border: '#C9D5D1', // input outlines: stronger than dividers
  },
  dark: {
    background: '#0C1715',
    paper: '#13211E',
    primary: '#6FCDB8',
    primaryLight: '#94DCCB',
    primaryDark: '#4FB09B',
    primaryContrast: '#06241F',
    accent: '#F28BA0',
    accentLight: '#F7AFBE',
    accentDark: '#E46A80',
    text: '#E6EFEC',
    textSecondary: '#9DB2AC',
    divider: '#23352F',
    border: '#354A44',
  },
} as const;

const FONT_FAMILY =
  '"Atkinson Hyperlegible Next Variable", "Atkinson Hyperlegible Next", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// Shadows only for floating layers (menus, dialogs, FABs); resting surfaces
// use hairline borders instead.
const makeShadows = (mode: ThemeMode): Shadows => {
  const ink = mode === 'light' ? '15, 39, 36' : '0, 0, 0';
  const strength = mode === 'light' ? 1 : 2.5;
  return [
    'none',
    ...Array.from({ length: 24 }, (_, i) => {
      const n = i + 1;
      return `0 1px 2px rgba(${ink}, ${(0.04 * strength).toFixed(2)}), 0 ${n}px ${n * 2.5}px rgba(${ink}, ${(0.07 * strength).toFixed(2)})`;
    }),
  ] as Shadows;
};

const theme = (mode: ThemeMode): Theme => {
  const t = TOKENS[mode];
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.primary,
        light: t.primaryLight,
        dark: t.primaryDark,
        contrastText: t.primaryContrast,
      },
      secondary: {
        main: t.accent,
        light: t.accentLight,
        dark: t.accentDark,
        contrastText: isLight ? '#FFFFFF' : '#2A0A12',
      },
      success: isLight
        ? { main: '#2F6B1F', light: '#4E8F3A', dark: '#21501A', contrastText: '#FFFFFF' }
        : { main: '#8FD47A', light: '#B2E3A2', dark: '#6DBA57', contrastText: '#0D2407' },
      warning: isLight
        ? { main: '#9A5B00', light: '#C27A12', dark: '#734400', contrastText: '#FFFFFF' }
        : { main: '#F2B95C', light: '#F6CD8A', dark: '#D99A35', contrastText: '#2B1A00' },
      error: isLight
        ? { main: '#B42318', light: '#D3473C', dark: '#8A1A12', contrastText: '#FFFFFF' }
        : { main: '#F59187', light: '#F8B1A9', dark: '#E5695C', contrastText: '#2B0905' },
      info: isLight
        ? { main: '#1F5AA6', light: '#3E78C4', dark: '#16427B', contrastText: '#FFFFFF' }
        : { main: '#8DB8F2', light: '#B0CEF6', dark: '#6A9BE0', contrastText: '#06182E' },
      background: {
        default: t.background,
        paper: t.paper,
      },
      text: {
        primary: t.text,
        secondary: t.textSecondary,
      },
      divider: t.divider,
      action: {
        hover: alpha(t.text, isLight ? 0.04 : 0.06),
        selected: alpha(t.primary, isLight ? 0.08 : 0.14),
        focus: alpha(t.primary, 0.14),
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: makeShadows(mode),
    typography: {
      fontFamily: FONT_FAMILY,
      fontWeightRegular: 400,
      fontWeightMedium: 550,
      fontWeightBold: 700,
      // Major-third scale on a 16px base. Display sizes flex with the
      // viewport; working sizes (h4 and below) stay fixed so dashboards
      // don't reflow as the window changes.
      h1: {
        fontSize: 'clamp(2.25rem, 1.4rem + 3.4vw, 3.75rem)',
        fontWeight: 700,
        lineHeight: 1.06,
        letterSpacing: '-0.028em',
      },
      h2: {
        fontSize: 'clamp(1.75rem, 1.3rem + 1.9vw, 2.5rem)',
        fontWeight: 700,
        lineHeight: 1.12,
        letterSpacing: '-0.022em',
      },
      h3: {
        fontSize: 'clamp(1.5rem, 1.3rem + 0.9vw, 1.953rem)',
        fontWeight: 680,
        lineHeight: 1.2,
        letterSpacing: '-0.016em',
      },
      h4: {
        fontSize: '1.5625rem',
        fontWeight: 680,
        lineHeight: 1.24,
        letterSpacing: '-0.012em',
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 650,
        lineHeight: 1.3,
        letterSpacing: '-0.006em',
      },
      h6: {
        fontSize: '1.0625rem',
        fontWeight: 650,
        lineHeight: 1.35,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.45,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.45,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.55,
      },
      caption: {
        fontSize: '0.78125rem',
        lineHeight: 1.45,
      },
      // Sentence case: the sidebar's group labels read as words, not chrome.
      overline: {
        fontSize: '0.78125rem',
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: 0,
        textTransform: 'none',
      },
      button: {
        fontSize: '0.9375rem',
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: 0,
        textTransform: 'none',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Tokens for the few stylesheets MUI doesn't reach (the schedule
          // calendar), so they follow the light/dark switch too.
          ':root': {
            '--dss-paper': t.paper,
            '--dss-background': t.background,
            '--dss-text': t.text,
            '--dss-text-secondary': t.textSecondary,
            '--dss-divider': t.divider,
            '--dss-border': t.border,
            '--dss-primary': t.primary,
            '--dss-primary-contrast': t.primaryContrast,
            '--dss-primary-tint': alpha(t.primary, isLight ? 0.08 : 0.16),
            '--dss-accent': t.accent,
          },
          body: {
            backgroundColor: t.background,
          },
          '::selection': {
            backgroundColor: alpha(t.primary, 0.22),
          },
          ':focus-visible': {
            outlineColor: t.primary,
          },
          // Date pickers render their own outlined input; match the 48px
          // height of every other text field.
          '.MuiPickersOutlinedInput-root:not(.MuiPickersInputBase-inputSizeSmall) .MuiPickersInputBase-sectionsContainer':
            {
              paddingTop: 12.5,
              paddingBottom: 12.5,
            },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
          color: 'inherit',
        },
        styleOverrides: {
          root: {
            backgroundColor: t.paper,
            color: t.text,
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: `1px solid ${t.divider}`,
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: false,
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            minHeight: 40,
            padding: '8px 16px',
            whiteSpace: 'nowrap',
            '@media (max-width: 600px)': {
              minHeight: 44,
            },
          },
          sizeSmall: {
            minHeight: 32,
            padding: '4px 12px',
            fontSize: '0.875rem',
            '@media (max-width: 600px)': {
              minHeight: 36,
            },
          },
          sizeLarge: {
            minHeight: 48,
            padding: '12px 22px',
            fontSize: '1rem',
          },
          outlined: {
            borderColor: t.border,
            '&:hover': {
              borderColor: isLight ? '#A9BAB4' : '#4C645D',
            },
            '&.MuiButton-colorPrimary': {
              borderColor: alpha(t.primary, 0.45),
              '&:hover': {
                borderColor: t.primary,
                backgroundColor: alpha(t.primary, 0.05),
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isLight
              ? '0 2px 4px rgba(15, 39, 36, 0.10), 0 8px 20px rgba(15, 39, 36, 0.16)'
              : '0 2px 4px rgba(0, 0, 0, 0.35), 0 8px 20px rgba(0, 0, 0, 0.45)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 12,
          },
          // Low elevations are resting surfaces: a hairline instead of a
          // shadow. Menus (8) and dialogs (24) keep their lift.
          elevation1: { border: `1px solid ${t.divider}` },
          elevation2: { border: `1px solid ${t.divider}`, boxShadow: 'none' },
          elevation3: { border: `1px solid ${t.divider}`, boxShadow: 'none' },
          elevation4: { border: `1px solid ${t.divider}`, boxShadow: 'none' },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${t.divider}`,
            boxShadow: 'none',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 20,
            '&:last-child': { paddingBottom: 20 },
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: { padding: '16px 20px' },
          title: { fontSize: '1.0625rem', fontWeight: 650 },
        },
      },
      MuiAccordion: {
        defaultProps: { elevation: 0, disableGutters: true },
        styleOverrides: {
          root: {
            border: `1px solid ${t.divider}`,
            borderRadius: 12,
            '&::before': { display: 'none' },
            '&:not(:last-of-type)': { marginBottom: 8 },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: 'none',
          },
          paperFullScreen: {
            borderRadius: 0,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontSize: '1.25rem', fontWeight: 650, padding: '20px 24px 12px' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: '12px 24px 20px', gap: 8 },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            border: `1px solid ${t.divider}`,
            borderRadius: 10,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${t.divider}`,
            borderRadius: 10,
          },
          list: { padding: 6 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            minHeight: 40,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? t.text : '#E6EFEC',
            color: isLight ? '#FFFFFF' : '#0C1715',
            fontSize: '0.8125rem',
            fontWeight: 500,
            borderRadius: 6,
            padding: '6px 10px',
          },
          arrow: {
            color: isLight ? t.text : '#E6EFEC',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderRight: `1px solid ${t.divider}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: t.divider },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
          },
          sizeSmall: {
            fontSize: '0.75rem',
            height: 24,
          },
          outlined: {
            borderColor: t.border,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          colorDefault: {
            backgroundColor: alpha(t.primary, isLight ? 0.1 : 0.2),
            color: t.primary,
            fontWeight: 650,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: t.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: t.border,
            },
            '&:hover:not(.Mui-disabled):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? '#9FB1AB' : '#56706A',
            },
            // 48px fields: comfortable touch targets without the 56px bulk.
            '& .MuiOutlinedInput-input:not(.MuiInputBase-inputMultiline):not(.MuiInputBase-inputSizeSmall):not(.MuiAutocomplete-input)':
              {
                paddingTop: 12.5,
                paddingBottom: 12.5,
              },
            '&.MuiInputBase-multiline:not(.MuiInputBase-sizeSmall)': {
              paddingTop: 12.5,
              paddingBottom: 12.5,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            '&.MuiInputLabel-outlined:not(.MuiInputLabel-shrink):not(.MuiInputLabel-sizeSmall)': {
              transform: 'translate(14px, 12px) scale(1)',
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { marginLeft: 2, marginTop: 6 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: alpha(t.primary, isLight ? 0.08 : 0.14),
              color: t.primary,
              '& .MuiListItemIcon-root': { color: t.primary },
              '&:hover': {
                backgroundColor: alpha(t.primary, isLight ? 0.12 : 0.2),
              },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { minWidth: 36 },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 44 },
          indicator: { height: 2, borderRadius: 2 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 44,
            fontWeight: 600,
            fontSize: '0.9375rem',
            textTransform: 'none',
            color: t.textSecondary,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: t.divider,
            fontVariantNumeric: 'tabular-nums',
          },
          head: {
            fontSize: '0.8125rem',
            fontWeight: 650,
            color: t.textSecondary,
            backgroundColor: isLight ? '#F8FAF9' : '#17271F',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.MuiTableRow-hover:hover': {
              backgroundColor: alpha(t.primary, isLight ? 0.035 : 0.06),
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            alignItems: 'flex-start',
          },
          standard: {
            border: '1px solid',
            '&.MuiAlert-colorSuccess': { borderColor: alpha(isLight ? '#2F6B1F' : '#8FD47A', 0.3) },
            '&.MuiAlert-colorInfo': { borderColor: alpha(isLight ? '#1F5AA6' : '#8DB8F2', 0.3) },
            '&.MuiAlert-colorWarning': { borderColor: alpha(isLight ? '#9A5B00' : '#F2B95C', 0.3) },
            '&.MuiAlert-colorError': { borderColor: alpha(isLight ? '#B42318' : '#F59187', 0.3) },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: alpha(t.primary, 0.12),
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(t.text, isLight ? 0.07 : 0.1),
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            color: isLight ? '#C9D5D1' : '#354A44',
            '&.Mui-active, &.Mui-completed': { color: t.primary },
          },
          text: { fontWeight: 700 },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          label: {
            fontWeight: 500,
            '&.Mui-active, &.Mui-completed': { fontWeight: 650 },
          },
        },
      },
      MuiLink: {
        defaultProps: {
          underline: 'hover',
        },
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderColor: t.border,
            '&.Mui-selected': {
              color: t.primary,
              backgroundColor: alpha(t.primary, isLight ? 0.08 : 0.16),
            },
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 700 },
        },
      },
    },
    transitions: {
      duration: {
        shortest: 120,
        shorter: 160,
        short: 200,
        standard: 240,
        complex: 320,
        enteringScreen: 220,
        leavingScreen: 180,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
  });
};

export default theme;
