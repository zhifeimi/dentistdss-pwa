import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';

interface Clinic {
  id: string | number;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface MapCenter {
  lat: number;
  lng: number;
}

interface UseMapControlsReturn {
  selectedClinic: Clinic | null;
  mapCenter: MapCenter;
  mapZoom: number;
  map: google.maps.Map | null;
  infoWindowOpen: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  locationError: string | null;
  handleClinicSelect: (clinic: Clinic) => void;
  handleMarkerClick: (clinic: Clinic) => void;
  handleInfoWindowClose: () => void;
  clearSelection: () => void;
  onMapLoad: (mapInstance: google.maps.Map) => void;
  onMapUnmount: () => void;
  fitBoundsToClinic: (clinics: Clinic[]) => void;
  centerOnUserLocation: () => void;
  resetMapView: () => void;
  setMapCenter: (center: MapCenter) => void;
  setMapZoom: (zoom: number) => void;
}

/**
 * Custom hook for Google Maps controls and state management
 *
 * Features:
 * - Map instance management
 * - Clinic selection and marker interaction
 * - Info window state management
 * - Map center and zoom controls
 * - User location integration
 * - Responsive map behavior
 */
export const useMapControls = (): UseMapControlsReturn => {
  // State management
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [mapCenter, setMapCenter] = useState<MapCenter>({ lat: -33.8688, lng: 151.2093 }); // Default to Sydney
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(false);

  // Get user's current location
  const { userLocation, locationError } = useGeolocation();

  // Update map center when user location is available
  useEffect(() => {
    if (userLocation && !selectedClinic) {
      setMapCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude
      });
      setMapZoom(12);
    }
  }, [userLocation, selectedClinic]);

  /**
   * Handle clinic selection from list
   */
  const handleClinicSelect = useCallback((clinic: Clinic): void => {
    setSelectedClinic(clinic);

    // Pan to the clinic when it has coordinates. Open either way: without a
    // location, MapSection shows "Location not available" instead of the info
    // window, so the click is never silent.
    if (clinic.latitude && clinic.longitude && map) {
      const newCenter = { lat: clinic.latitude, lng: clinic.longitude };
      map.panTo(newCenter);
      setMapCenter(newCenter);
      setMapZoom(15);
    }
    setInfoWindowOpen(true);
  }, [map]);

  /**
   * Handle marker click on map
   */
  const handleMarkerClick = useCallback((clinic: Clinic): void => {
    setSelectedClinic(clinic);
    setInfoWindowOpen(true);
    
    // Center map on clicked marker
    if (clinic.latitude && clinic.longitude && map) {
      const newCenter = { lat: clinic.latitude, lng: clinic.longitude };
      map.panTo(newCenter);
      setMapCenter(newCenter);
    }
  }, [map]);

  /**
   * Handle info window close
   */
  const handleInfoWindowClose = useCallback(() => {
    setInfoWindowOpen(false);
    // Keep clinic selected but close info window
  }, []);

  /**
   * Clear selected clinic
   */
  const clearSelection = useCallback(() => {
    setSelectedClinic(null);
    setInfoWindowOpen(false);
  }, []);

  /**
   * Handle map load event
   */
  const onMapLoad = useCallback((mapInstance: google.maps.Map): void => {
    setMap(mapInstance);

    // Add click listener to clear selection when clicking on map
    mapInstance.addListener('click', () => {
      setSelectedClinic(null);
      setInfoWindowOpen(false);
    });
  }, []); // Remove dependencies to prevent infinite re-renders

  /**
   * Handle map unmount event
   */
  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  /**
   * Fit map bounds to show all clinics
   */
  const fitBoundsToClinic = useCallback((clinics: Clinic[]): void => {
    if (!map || !clinics.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidCoords = false;

    clinics.forEach(clinic => {
      if (clinic.latitude && clinic.longitude) {
        bounds.extend({
          lat: clinic.latitude,
          lng: clinic.longitude
        });
        hasValidCoords = true;
      }
    });

    if (hasValidCoords) {
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map && map.getZoom() && map.getZoom()! > 15) {
          map.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map]);

  /**
   * Center map on user location
   */
  const centerOnUserLocation = useCallback(() => {
    if (userLocation && map) {
      const userCenter = {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      };
      map.panTo(userCenter);
      setMapCenter(userCenter);
      setMapZoom(12);
    }
  }, [userLocation, map]);

  /**
   * Reset map to default view
   */
  const resetMapView = useCallback(() => {
    const defaultCenter = { lat: -33.8688, lng: 151.2093 };
    setMapCenter(defaultCenter);
    setMapZoom(11);
    setSelectedClinic(null);
    setInfoWindowOpen(false);

    if (map) {
      map.panTo(defaultCenter);
      map.setZoom(11);
    }
  }, [map]); // Remove clearSelection dependency

  return {
    // State
    selectedClinic,
    mapCenter,
    mapZoom,
    map,
    infoWindowOpen,
    userLocation,
    locationError,
    
    // Actions
    handleClinicSelect,
    handleMarkerClick,
    handleInfoWindowClose,
    clearSelection,
    onMapLoad,
    onMapUnmount,
    fitBoundsToClinic,
    centerOnUserLocation,
    resetMapView,
    
    // Setters for external control
    setMapCenter,
    setMapZoom,
  };
};
