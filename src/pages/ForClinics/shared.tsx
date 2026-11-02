import React from 'react';
import { Box, Breadcrumbs, Button, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { CLINIC_FEATURES, featurePath, FOR_CLINICS_PATH } from '../../content/forClinics';

interface Crumb {
  name: string;
  to?: string;
}

/** Visible breadcrumbs; the matching BreadcrumbList JSON-LD lives in the SEO registry. */
export const PageBreadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => (
  <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 3 }}>
    {items.map(({ name, to }) =>
      to
        ? <Link key={name} component={RouterLink} to={to} underline="hover" color="inherit">{name}</Link>
        : <Typography key={name} color="text.primary" aria-current="page">{name}</Typography>
    )}
  </Breadcrumbs>
);

/** Register / join calls to action, shared by every clinic page. */
export const ClinicSignupActions: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
    <Button component={RouterLink} to="/signup/clinic-admin" variant="contained" size="large">
      Register your clinic
    </Button>
    <Button component={RouterLink} to="/signup/clinic-staff" variant="outlined" size="large">
      Join your clinic's team
    </Button>
  </Box>
);

/** Links between the feature pages, excluding the current one. */
export const OtherFeatures: React.FC<{ current?: string }> = ({ current }) => (
  <Box component="nav" aria-label="DentistDSS for clinics">
    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5 }}>
      {CLINIC_FEATURES.filter(({ slug }) => slug !== current).map((feature) => (
        <li key={feature.slug}>
          <Link component={RouterLink} to={featurePath(feature)} sx={{ fontWeight: 650 }}>
            {feature.name}
          </Link>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{feature.summary}</Typography>
        </li>
      ))}
      {current && (
        <li>
          <Link component={RouterLink} to={FOR_CLINICS_PATH} sx={{ fontWeight: 650 }}>
            All features for clinics
          </Link>
        </li>
      )}
    </Box>
  </Box>
);
