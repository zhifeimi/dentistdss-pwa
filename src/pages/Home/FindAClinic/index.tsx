import React, { useState, useCallback } from 'react';
import { Box, Container, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useSearchParams } from 'react-router';

import SearchSection from '../../../components/FindAClinic/SearchSection';
import MapSection from '../../../components/FindAClinic/MapSection';
import ClinicList from '../../../components/FindAClinic/ClinicList';

import { useClinicSearch } from '../../../hooks/useClinicSearch';
import { useMapControls } from '../../../hooks/useMapControls';
import type { ClinicSearchResult } from '../../../types/api';

interface ClinicWithCoords extends ClinicSearchResult {
  lat?: number;
  lng?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * FindAClinic — clinic search: results list first (what patients read),
 * map beside it on wide screens and below it on phones.
 * `?q=` (from the home page search) pre-fills and runs the search.
 */
const FindAClinic: React.FC = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  const [clinicsWithCoords, setClinicsWithCoords] = useState<ClinicWithCoords[]>([]);

  const {
    searchKeywords,
    setSearchKeywords,
    clinics,
    loading,
    handleSearch,
    clearResults,
  } = useClinicSearch(searchParams.get('q') ?? '');

  const {
    selectedClinic,
    mapCenter,
    mapZoom,
    infoWindowOpen,
    handleClinicSelect,
    handleMarkerClick,
    handleInfoWindowClose,
    onMapLoad,
    onMapUnmount,
  } = useMapControls();

  const selectedClinicAsSearchResult = selectedClinic as ClinicSearchResult | null;

  const handleClinicsWithCoordsChange = useCallback((geocodedClinics: ClinicWithCoords[]) => {
    setClinicsWithCoords(geocodedClinics);
  }, []);

  return (
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h2" component="h1">
        Find a clinic
      </Typography>
      <Typography sx={{ mt: 1, mb: 3, color: 'text.secondary', maxWidth: '60ch' }}>
        Search by suburb, clinic name or treatment. Choose a clinic to see it on the map and book a
        visit.
      </Typography>

      <SearchSection
        searchKeywords={searchKeywords}
        setSearchKeywords={setSearchKeywords}
        loading={loading}
        onSearch={handleSearch}
        onClearResults={clearResults}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(340px, 5fr) 7fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <ClinicList
          clinics={clinicsWithCoords.length > 0 ? clinicsWithCoords : clinics}
          selectedClinic={selectedClinicAsSearchResult}
          loading={loading}
          hasQuery={searchKeywords.trim() !== ''}
          isMobile={isMobile}
          onClinicSelect={handleClinicSelect}
        />
        <Box sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
          <MapSection
            clinics={clinics}
            selectedClinic={selectedClinicAsSearchResult}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            infoWindowOpen={infoWindowOpen}
            isMobile={isMobile}
            onMarkerClick={handleMarkerClick}
            onInfoWindowClose={handleInfoWindowClose}
            onMapLoad={onMapLoad}
            onMapUnmount={onMapUnmount}
            onClinicsWithCoordsChange={handleClinicsWithCoordsChange}
          />
        </Box>
      </Box>
    </Container>
  );
});

FindAClinic.displayName = 'FindAClinic';

export default FindAClinic;
