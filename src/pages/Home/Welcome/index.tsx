import React from 'react';
import { Box } from '@mui/material';
import HeroSection from './sections/HeroSection';
import FeatureGrid from './sections/FeatureGrid';
import StatsBand from './sections/StatsBand';
import HowItWorks from './sections/HowItWorks';
import Testimonials from './sections/Testimonials';
import CtaBand from './sections/CtaBand';

/**
 * Welcome — the DentistDSS landing page: a pure composition of sections.
 * Rich modern SaaS structure: gradient-mesh hero with the Dentabot product
 * preview, feature grid, stats band, how-it-works, testimonials, final CTA.
 * No stock photography — every visual is code-built.
 */
const Welcome: React.FC = () => (
  <Box component="main">
    <HeroSection />
    <FeatureGrid />
    <StatsBand />
    <HowItWorks />
    <Testimonials />
    <CtaBand />
  </Box>
);

export default Welcome;
