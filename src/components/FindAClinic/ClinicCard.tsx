import React, { MouseEvent, KeyboardEvent } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Link,
  Chip,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Directions as DirectionsIcon,
} from '@mui/icons-material';
import { openDirections } from '../../utils/mapUtils';
import { TOUCH_TARGETS } from '../../utils/mobileOptimization';
import type { Clinic } from '../../types/api';

interface ClinicCardProps {
  clinic: Clinic;
  isSelected: boolean;
  onClick: () => void;
  isMobile: boolean;
  isLast: boolean;
}

/**
 * ClinicCard Component
 *
 * Individual clinic card with:
 * - Mobile-first responsive design
 * - Accessible interaction patterns
 * - Contact information with direct actions
 * - Visual selection states
 * - Proper touch targets for mobile
 */
const ClinicCard = React.memo<ClinicCardProps>(({
  clinic,
  isSelected,
  onClick,
  isMobile,
  isLast
}) => {
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

  const handlePhoneClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (clinic.phoneNumber) {
      window.open(`tel:${clinic.phoneNumber}`, '_self');
    }
  };

  const handleEmailClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (clinic.email) {
      window.open(`mailto:${clinic.email}`, '_self');
    }
  };

  const handleWebsiteClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (clinic.website) {
      window.open(clinic.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      sx={{
        mb: isLast ? 0 : { xs: 1.5, sm: 2 },
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'background.paper',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
          transform: 'translateY(-1px)',
          boxShadow: 3,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' },
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Select ${clinic.name} clinic`}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        {/* Clinic Name and Status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant="subtitle1" 
            component="h3"
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              lineHeight: 1.3,
              flex: 1,
              mr: 1,
            }}
          >
            {clinic.name}
          </Typography>
          
          {isSelected && (
            <Chip
              label="Selected"
              size="small"
              color="primary"
              sx={{ 
                fontSize: '0.7rem',
                height: 24,
              }}
            />
          )}
        </Box>

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
              color="text.secondary"
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

        {/* Contact Information */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
          {/* Phone */}
          {clinic.phoneNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                onClick={handlePhoneClick}
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
                {clinic.phoneNumber}
              </Link>
            </Box>
          )}

          {/* Email */}
          {clinic.email && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                onClick={handleEmailClick}
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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WebsiteIcon 
                sx={{ 
                  fontSize: { xs: 16, sm: 18 }, 
                  mr: 0.5,
                  color: 'text.secondary',
                }} 
              />
              <Link
                component="button"
                variant="body2"
                onClick={handleWebsiteClick}
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
                Visit Website
              </Link>
            </Box>
          )}
        </Box>

        {/* Directions Button */}
        {clinic.latitude && clinic.longitude && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DirectionsIcon />}
            onClick={handleDirections}
            fullWidth
            sx={{ 
              minHeight: { xs: TOUCH_TARGETS.MINIMUM - 8, sm: 36 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              fontWeight: 500,
              borderRadius: 1.5,
            }}
          >
            Get Directions
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

ClinicCard.displayName = 'ClinicCard';

export default ClinicCard;
