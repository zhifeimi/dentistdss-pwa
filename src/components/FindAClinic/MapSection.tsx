import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  CircularProgress,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import config from '../../config';
import ClinicInfoWindow from '../../components/FindAClinic/ClinicInfoWindow';
import { useGeocoding } from '../../hooks/useGeocoding';
import type { ClinicSearchResult } from '../../types/api';

interface MapCenter {
  lat: number;
  lng: number;
}

interface MapSectionProps {
  clinics: ClinicSearchResult[];
  selectedClinic?: ClinicSearchResult | null;
  mapCenter: MapCenter;
  mapZoom: number;
  infoWindowOpen: boolean;
  isMobile: boolean;
  onMarkerClick: (clinic: ClinicSearchResult) => void;
  onInfoWindowClose: () => void;
  onMapLoad: (map: google.maps.Map) => void;
  onMapUnmount: (map: google.maps.Map) => void;
  onClinicsWithCoordsChange?: (clinics: ClinicSearchResult[]) => void;
}

/**
 * MapSection Component
 *
 * Responsive Google Maps interface with:
 * - Mobile-first responsive design
 * - Geocoded clinic markers
 * - Interactive info windows
 * - Loading states and error handling
 * - Optimized map controls for mobile
 */
const MapSection = React.memo<MapSectionProps>(({
  clinics,
  selectedClinic = null,
  mapCenter,
  mapZoom,
  infoWindowOpen,
  isMobile,
  onMarkerClick,
  onInfoWindowClose,
  onMapLoad,
  onMapUnmount,
  onClinicsWithCoordsChange
}) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // State for Google Maps API readiness
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Use geocoding hook for clinic coordinates
  const { clinicsWithCoords, geocoding } = useGeocoding(clinics);


  // Notify parent component when geocoded clinics change
  useEffect(() => {
    if (onClinicsWithCoordsChange) {
      onClinicsWithCoordsChange(clinicsWithCoords);
    }
  }, [clinicsWithCoords, onClinicsWithCoordsChange]);

  // Find the selected clinic with coordinates from the geocoded list
  const selectedClinicWithCoords = selectedClinic
    ? clinicsWithCoords.find(clinic => clinic.id === selectedClinic.id) || selectedClinic
    : null;



  // Responsive map height
  const getMapHeight = (): string => {
    if (isMobile) return '400px';
    if (isTablet) return '500px';
    return '600px';
  };

  // Responsive map container style
  const mapContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: getMapHeight(),
    borderRadius: theme.shape.borderRadius,
    display: 'block',
    boxSizing: 'border-box',
  };

  // Map options optimized for different screen sizes
  const getMapOptions = (): google.maps.MapOptions => ({
    disableDefaultUI: isMobile,
    zoomControl: true,
    mapTypeControl: !isMobile,
    scaleControl: !isMobile,
    streetViewControl: !isMobile,
    rotateControl: false,
    fullscreenControl: !isMobile,
    gestureHandling: isMobile ? 'cooperative' : 'auto',
    // Muted base map so clinic markers carry the color.
    styles: [
      { stylers: [{ saturation: -55 }] },
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.medical', elementType: 'labels', stylers: [{ visibility: 'on' }] },
      { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
    ]
  });



  return (
    <Paper
      elevation={3}
      sx={{
        height: getMapHeight(),
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%', // Ensure full width within Grid item
        minWidth: '100%', // Prevent width collapse
        maxWidth: '100%', // Prevent overflow
        minHeight: getMapHeight(), // Ensure minimum height
        display: 'block',
        boxSizing: 'border-box',
        flex: '1 1 auto',
      }}
    >


      {/* Loading Overlay */}
      {geocoding && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: 'background.paper',
            borderRadius: '50%',
            p: 1,
            boxShadow: 2,
          }}
        >
          <CircularProgress
            size={isMobile ? 24 : 32}
            thickness={4}
          />
        </Box>
      )}

      <LoadScript
        googleMapsApiKey={config.api.google.mapsApiKey}
        onLoad={(): void => {
          setIsGoogleMapsLoaded(true);
        }}
        onError={(): void => {
          setIsGoogleMapsLoaded(false);
        }}
        loadingElement={
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={mapZoom}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          options={getMapOptions()}
        >
          {/* Clinic Markers */}
          {isGoogleMapsLoaded && clinicsWithCoords
            .filter(clinic => clinic.latitude && clinic.longitude)
            .map((clinic, index) => (
              <Marker
                key={clinic.id || `clinic-${index}`}
                position={{
                  lat: typeof clinic.latitude === 'number' ? clinic.latitude : parseFloat(clinic.latitude || '0'),
                  lng: typeof clinic.longitude === 'number' ? clinic.longitude : parseFloat(clinic.longitude || '0')
                }}
                onClick={(): void => {
                  onMarkerClick(clinic);
                }}
                title={clinic.name}
              />
            ))
          }

          {/* Info Window */}
          {isGoogleMapsLoaded &&
            selectedClinicWithCoords &&
            infoWindowOpen &&
            selectedClinicWithCoords.latitude &&
            selectedClinicWithCoords.longitude &&
            window.google?.maps?.Size && (
              <InfoWindow
                position={{
                  lat: typeof selectedClinicWithCoords.latitude === 'number' ? selectedClinicWithCoords.latitude : parseFloat(selectedClinicWithCoords.latitude || '0'),
                  lng: typeof selectedClinicWithCoords.longitude === 'number' ? selectedClinicWithCoords.longitude : parseFloat(selectedClinicWithCoords.longitude || '0')
                }}
                onCloseClick={(): void => {
                  onInfoWindowClose();
                }}
                options={{
                  pixelOffset: new window.google.maps.Size(0, -30),
                  maxWidth: isMobile ? 280 : 320,
                  disableAutoPan: false,
                }}
              >
                <div>
                  <ClinicInfoWindow
                    clinic={selectedClinicWithCoords}
                    isMobile={isMobile}
                  />
                </div>
              </InfoWindow>
            )}

          {/* Fallback message when clinic has no coordinates */}
          {selectedClinic &&
            infoWindowOpen &&
            (!selectedClinicWithCoords?.latitude || !selectedClinicWithCoords?.longitude) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'background.paper',
                  p: 2,
                  borderRadius: 1,
                  boxShadow: 3,
                  zIndex: 1000,
                  maxWidth: 300,
                  textAlign: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Location not available for {selectedClinic.name}
                </Typography>
              </Box>
            )}
        </GoogleMap>
      </LoadScript>
    </Paper>
  );
});

MapSection.displayName = 'MapSection';

export default MapSection;
