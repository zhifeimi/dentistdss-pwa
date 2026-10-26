import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router';
import HeroSection from './sections/HeroSection';
import HowItWorks from './sections/HowItWorks';
import DentabotSection from './sections/DentabotSection';
import ForClinics from './sections/ForClinics';

/**
 * Welcome — the public home page. Patients first (search, how booking works,
 * Dentabot), then the clinic pitch. Sections are small and code-built, so
 * they ship in this route's chunk rather than lazily, which also lets
 * /#for-clinics scroll to a section that already exists.
 */
const Welcome: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <Box component="main">
      <HeroSection />
      <HowItWorks />
      <DentabotSection />
      <ForClinics />
    </Box>
  );
};

export default Welcome;
