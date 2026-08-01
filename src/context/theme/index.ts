import { createTheme, Theme } from '@mui/material/styles';
import { ThemeMode } from '../../types';

// DentistDSS theme — clerk.com visual language: near-black text on white,
// a single violet accent, fine gray borders, restrained shadows, generous
// whitespace. Same factory shape in both modes; dark is the inverse with a
// lifted violet.
const theme = (mode: ThemeMode): Theme => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#6C47FF' : '#8B6BFF',
      light: mode === 'light' ? '#8B6BFF' : '#A98FFF',
      dark: mode === 'light' ? '#5636E8' : '#6C47FF',
      contrastText: '#ffffff',
    },
    secondary: {
      // Clerk's second CTA voice is near-black on light / near-white on dark.
      main: mode === 'light' ? '#131316' : '#f4f4f5',
      light: mode === 'light' ? '#3a3a40' : '#ffffff',
      dark: mode === 'light' ? '#000000' : '#a1a1aa',
      contrastText: mode === 'light' ? '#ffffff' : '#131316',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: mode === 'light' ? '#f7f7f8' : '#131316',
      paper: mode === 'light' ? '#ffffff' : '#1c1c21',
    },
    text: {
      primary: mode === 'light' ? '#131316' : '#f4f4f5',
      secondary: mode === 'light' ? '#6b6b76' : '#a1a1aa',
    },
    divider: mode === 'light' ? '#e5e5ea' : '#2e2e35',
  },
  typography: {
    fontFamily: '"Inter Variable", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 'clamp(1rem, 2vw, 1.25rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: 'clamp(0.875rem, 1.25vw, 1rem)',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: 'clamp(0.875rem, 1.25vw, 1rem)',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: mode === 'light' ? '1px solid #e5e5ea' : '1px solid #2e2e35',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
          minHeight: 44, // Minimum touch target size
          padding: '12px 20px',
          '@media (max-width: 600px)': {
            minHeight: 48, // Larger touch target on mobile
            padding: '14px 24px',
            fontSize: '1rem',
          },
        },
        contained: {
          boxShadow: '0 1px 2px rgba(19, 19, 22, 0.08)',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(19, 19, 22, 0.12)',
          },
        },
        sizeSmall: {
          minHeight: 36,
          padding: '8px 16px',
          '@media (max-width: 600px)': {
            minHeight: 40,
            padding: '10px 18px',
          },
        },
        sizeLarge: {
          minHeight: 52,
          padding: '16px 28px',
          '@media (max-width: 600px)': {
            minHeight: 56,
            padding: '18px 32px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(19, 19, 22, 0.05)',
          border: mode === 'light'
            ? '1px solid #e5e5ea'
            : '1px solid #2e2e35',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: mode === 'light'
            ? '1px solid #e5e5ea'
            : '1px solid #2e2e35',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            minHeight: 44, // Minimum touch target
            '@media (max-width: 600px)': {
              minHeight: 48, // Larger on mobile
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 14px',
            '@media (max-width: 600px)': {
              padding: '14px 16px',
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
          '& .MuiInputLabel-root': {
            '@media (max-width: 600px)': {
              fontSize: '16px',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        elevation1: {
          boxShadow: '0 1px 2px rgba(19, 19, 22, 0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 0',
          '&.Mui-selected': {
            backgroundColor: mode === 'light'
              ? 'rgba(108, 71, 255, 0.08)'
              : 'rgba(139, 107, 255, 0.16)',
            '&:hover': {
              backgroundColor: mode === 'light'
                ? 'rgba(108, 71, 255, 0.12)'
                : 'rgba(139, 107, 255, 0.24)',
            },
          },
        },
      },
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 10,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

export default theme;
