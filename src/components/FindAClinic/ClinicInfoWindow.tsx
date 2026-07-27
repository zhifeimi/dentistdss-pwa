import React, { MouseEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Link,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Directions as DirectionsIcon
} from '@mui/icons-material';
import { openDirections } from '../../utils/mapUtils';
import { TOUCH_TARGETS } from '../../utils/mobileOptimization';
import type { ClinicSearchResult } from '../../types/api';

interface ClinicInfoWindowProps {
  clinic: ClinicSearchResult;
  isMobile: boolean;
}

/**
 * ClinicInfoWindow Component
 *
 * Displays clinic information in Google Maps InfoWindow with:
 * - Responsive design for mobile and desktop
 * - Accessible contact information
 * - Direct navigation integration
 * - Proper touch targets for mobile
 */
const ClinicInfoWindow = React.memo<ClinicInfoWindowProps>(({ clinic, isMobile }) => {
  const handleDirections = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    if (clinic.latitude && clinic.longitude) {
      openDirections({
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        name: clinic.name
      });
    }
  };

  const handlePhoneClick = (phoneNumber: string): void => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleEmailClick = (email: string): void => {
    window.open(`mailto:${email}`, '_self');
  };

  return (
    <Box 
      sx={{ 
        minWidth: isMobile ? 240 : 280,
        maxWidth: isMobile ? 280 : 320,
        p: { xs: 1, sm: 1.5 },
      }}
    >
      {/* Clinic Name */}
      <Typography 
        variant="subtitle1" 
        component="h3"
        sx={{ 
          fontWeight: 'bold',
          mb: 1,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          lineHeight: 1.3,
        }}
      >
        {clinic.name}
      </Typography>

      {/* Address */}
      {clinic.address && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <LocationIcon 
            sx={{ 
              fontSize: { xs: 16, sm: 18 }, 
              mt: 0.2,
              mr: 0.5,
              color: 'text.secondary',
              flexShrink: 0,
            }} 
          />
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              lineHeight: 1.4,
            }}
          >
            {clinic.address}
            {clinic.city && `, ${clinic.city}`}
            {clinic.state && `, ${clinic.state}`}
            {clinic.zipCode && ` ${clinic.zipCode}`}
          </Typography>
        </Box>
      )}

      {/* Phone Number */}
      {clinic.phone && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PhoneIcon
            sx={{
              fontSize: { xs: 16, sm: 18 },
              mr: 0.5,
              color: 'text.secondary',
            }}
          />
          <Link
            component="button"
            variant="body2"
            onClick={() => clinic.phone && handlePhoneClick(clinic.phone)}
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              textAlign: 'left',
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {clinic.phone}
          </Link>
        </Box>
      )}

      {/* Email */}
      {clinic.email && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmailIcon 
            sx={{ 
              fontSize: { xs: 16, sm: 18 }, 
              mr: 0.5,
              color: 'text.secondary',
            }} 
          />
          <Link
            component="button"
            variant="body2"
            onClick={() => clinic.email && handleEmailClick(clinic.email)}
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              textAlign: 'left',
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {clinic.email}
          </Link>
        </Box>
      )}

      {/* Website */}
      {clinic.website && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <WebsiteIcon 
            sx={{ 
              fontSize: { xs: 16, sm: 18 }, 
              mr: 0.5,
              color: 'text.secondary',
            }} 
          />
          <Link
            href={clinic.website}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Visit Website
          </Link>
        </Box>
      )}

      {/* Directions Button */}
      {clinic.latitude && clinic.longitude && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<DirectionsIcon />}
          onClick={handleDirections}
          fullWidth
          sx={{ 
            mt: 1,
            minHeight: { xs: TOUCH_TARGETS.MINIMUM - 8, sm: 36 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            fontWeight: 500,
            borderRadius: 1.5,
          }}
        >
          Get Directions
        </Button>
      )}
    </Box>
  );
});

ClinicInfoWindow.displayName = 'ClinicInfoWindow';

export default ClinicInfoWindow;
