import React, { MouseEvent } from 'react';
import { Box, Button, Link, Typography } from '@mui/material';
import {
  Directions as DirectionsIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';
import { openDirections } from '../../utils/mapUtils';
import type { Clinic } from '../../types/api';

interface ClinicCardProps {
  clinic: Clinic;
  isSelected: boolean;
  onClick: () => void;
}

const stop = (event: MouseEvent) => event.stopPropagation();

/**
 * ClinicCard — one search result. Clicking the card (or "Show on map")
 * selects it on the map; the actions book a visit or open directions.
 */
const ClinicCard = React.memo<ClinicCardProps>(({ clinic, isSelected, onClick }) => {
  const address = [clinic.address, clinic.city, [clinic.state, clinic.zipCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  const hasLocation = Boolean(clinic.latitude && clinic.longitude);

  const handleDirections = (event: MouseEvent): void => {
    event.stopPropagation();
    if (clinic.latitude && clinic.longitude) {
      openDirections({ latitude: clinic.latitude, longitude: clinic.longitude, name: clinic.name });
    }
  };

  return (
    <Box
      component="li"
      onClick={onClick}
      sx={{
        listStyle: 'none',
        p: { xs: 2, sm: 2.5 },
        bgcolor: 'background.paper',
        border: 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        boxShadow: (theme) => (isSelected ? `inset 0 0 0 1px ${theme.palette.primary.main}` : 'none'),
        borderRadius: 2,
        cursor: 'pointer',
        transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
        '&:hover': { borderColor: isSelected ? 'primary.main' : 'text.secondary' },
      }}
    >
      <Typography variant="h6" component="h3">
        {clinic.name}
      </Typography>

      {address && (
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {address}
        </Typography>
      )}

      {(clinic.phoneNumber || clinic.email || clinic.website) && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5 }}>
          {clinic.phoneNumber && (
            <Link href={`tel:${clinic.phoneNumber}`} variant="body2" onClick={stop}>
              {clinic.phoneNumber}
            </Link>
          )}
          {clinic.email && (
            <Link href={`mailto:${clinic.email}`} variant="body2" onClick={stop}>
              Email
            </Link>
          )}
          {clinic.website && (
            <Link href={clinic.website} target="_blank" rel="noopener noreferrer" variant="body2" onClick={stop}>
              Website
            </Link>
          )}
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button
          component={RouterLink}
          to={`/appointments?book=${encodeURIComponent(String(clinic.id))}`}
          variant="contained"
          size="small"
          onClick={stop}
        >
          Book a visit
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PlaceIcon />}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          aria-pressed={isSelected}
        >
          Show on map
        </Button>
        {hasLocation && (
          <Button size="small" startIcon={<DirectionsIcon />} onClick={handleDirections}>
            Directions
          </Button>
        )}
      </Box>
    </Box>
  );
});

ClinicCard.displayName = 'ClinicCard';

export default ClinicCard;
