import React from 'react';
import { Box } from '@mui/material';
import HeroSection from './sections/HeroSection';
import DeferredSection from '../../../components/shared/DeferredSection';

/**
 * Welcome — the DentistDSS landing page: a pure composition of sections.
 * Rich modern SaaS structure: gradient-mesh hero with the Dentabot product
 * preview, feature grid, stats band, how-it-works, testimonials, final CTA.
 * No stock photography — every visual is code-built.
 *
 * The hero is the LCP element and stays eager; below-fold sections are split
 * into their own chunks and rendered only when they approach the viewport.
 * DeferredSection owns the Suspense boundary and keeps its minHeight until
 * each section has rendered, so mounting sections never shift layout.
 */
const FeatureGrid = React.lazy(() => import('./sections/FeatureGrid'));
const StatsBand = React.lazy(() => import('./sections/StatsBand'));
const HowItWorks = React.lazy(() => import('./sections/HowItWorks'));
const Testimonials = React.lazy(() => import('./sections/Testimonials'));
const CtaBand = React.lazy(() => import('./sections/CtaBand'));

const Welcome: React.FC = () => (
  <Box component="main">
    <HeroSection />
    <DeferredSection minHeight={520}>
      <FeatureGrid />
    </DeferredSection>
    <DeferredSection minHeight={180}>
      <StatsBand />
    </DeferredSection>
    <DeferredSection minHeight={460}>
      <HowItWorks />
    </DeferredSection>
    <DeferredSection minHeight={420}>
      <Testimonials />
    </DeferredSection>
    <DeferredSection minHeight={260}>
      <CtaBand />
    </DeferredSection>
  </Box>
);

export default Welcome;
