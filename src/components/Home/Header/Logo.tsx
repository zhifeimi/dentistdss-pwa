import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { LocalHospital as LocalHospitalIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';
import { HEADER_STYLES } from './constants';

interface LogoProps {
  darkMode: boolean;
  scrolled: boolean;
}

/**
 * Logo component for the header
 * Simplified and focused on logo display logic
 */
export const Logo: React.FC<LogoProps> = ({ darkMode, scrolled }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      component={RouterLink}
      to="/"
      sx={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      <LocalHospitalIcon
        sx={{
          mr: { xs: 0.5, sm: 1 },
          color: darkMode ? HEADER_STYLES.darkModeIconColor : 'inherit',
          filter: darkMode ? HEADER_STYLES.darkModeIconFilter : 'none',
          fontSize: {
            xs: '1.2rem',
            sm: scrolled ? '1.5rem' : '2rem',
            md: scrolled ? '1.8rem' : '3rem'
          },
          transition: 'font-size 0.3s ease',
        }}
      />
      <Typography
        variant={isMobile ? "body1" : (scrolled ? "subtitle1" : "h6")}
        component="div"
        sx={{
          fontWeight: 'bold',
          color: darkMode ? HEADER_STYLES.darkModeTextColor : 'inherit',
          textShadow: darkMode ? HEADER_STYLES.darkModeTextShadow : 'none',
          transition: 'font-size 0.3s ease',
          fontSize: { xs: '0.9rem', sm: '1rem', md: scrolled ? '1rem' : '1.25rem' }
        }}
      >
        DentistDSS
      </Typography>
    </Box>
  );
};
