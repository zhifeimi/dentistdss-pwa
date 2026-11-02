import React from 'react';
import { Box, Card, CardActionArea, CardContent, Container, Grid, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { CLINIC_FEATURES, featurePath, FOR_CLINICS_HUB } from '../../content/forClinics';
import ClinicSchedulePreview from '../Home/Welcome/sections/ClinicSchedulePreview';
import { ClinicSignupActions, PageBreadcrumbs } from './shared';

/**
 * ForClinics — the landing page for dental clinics (/for-clinics): what
 * DentistDSS does for a practice, how to get started, and links to one page
 * per feature. Copy lives in src/content/forClinics.ts.
 */
const ForClinics: React.FC = () => (
  <Box component="main">
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <PageBreadcrumbs items={[{ name: 'Home', to: '/' }, { name: 'For clinics' }]} />
      <Grid container spacing={{ xs: 5, md: 8 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h2" component="h1" sx={{ maxWidth: '18ch' }}>
            {FOR_CLINICS_HUB.heading}
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: '1.125rem', color: 'text.secondary', maxWidth: '50ch' }}>
            {FOR_CLINICS_HUB.intro}
          </Typography>
          <Box sx={{ mt: 4 }}>
            <ClinicSignupActions />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ClinicSchedulePreview />
        </Grid>
      </Grid>
    </Container>

    <Box
      component="section"
      aria-labelledby="features-heading"
      sx={{ bgcolor: 'background.paper', borderTop: 1, borderBottom: 1, borderColor: 'divider', py: { xs: 7, md: 10 } }}
    >
      <Container maxWidth="lg">
        <Typography id="features-heading" variant="h3" component="h2">
          What your clinic gets
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {CLINIC_FEATURES.map((feature) => (
            <Grid key={feature.slug} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea component={RouterLink} to={featurePath(feature)} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" component="h3">{feature.name}</Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      {feature.summary}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2, color: 'primary.main', fontWeight: 650 }}>
                      Learn more →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>

    <Container maxWidth="lg" component="section" aria-labelledby="start-heading" sx={{ py: { xs: 7, md: 10 } }}>
      <Typography id="start-heading" variant="h3" component="h2">
        How to get started
      </Typography>
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, mt: 4 }}>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {FOR_CLINICS_HUB.steps.map(({ title, text }, index) => (
            <Grid component="li" key={title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ borderTop: 2, borderColor: 'text.primary', pt: 2 }}>
                <Typography aria-hidden sx={{ fontSize: '2rem', fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
                  {index + 1}
                </Typography>
                <Typography variant="h6" component="h3" sx={{ mt: 1.5 }}>{title}</Typography>
                <Typography sx={{ mt: 1, color: 'text.secondary' }}>{text}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Typography sx={{ mt: 6, color: 'text.secondary', maxWidth: '60ch' }}>
        {FOR_CLINICS_HUB.browser}
      </Typography>
      <Box sx={{ mt: 4 }}>
        <ClinicSignupActions />
      </Box>
    </Container>
  </Box>
);

export default ForClinics;
