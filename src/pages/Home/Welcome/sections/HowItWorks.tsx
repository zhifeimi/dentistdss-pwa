import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';

const STEPS: { title: string; text: string }[] = [
  {
    title: 'Search for a clinic',
    text: 'Look up clinics near you by suburb, name or treatment and compare where they are.',
  },
  {
    title: 'Choose a dentist and a time',
    text: 'See open appointments and pick the one that fits your day. No calls, no hold music.',
  },
  {
    title: 'Tell the clinic why you are coming',
    text: 'Add your reason and symptoms once, so your dentist has them before you sit down.',
  },
];

/** HowItWorks — the three booking steps, in order, on a ruled band. */
const HowItWorks: React.FC = () => (
  <Box
    component="section"
    aria-labelledby="how-booking-works"
    sx={{
      bgcolor: 'background.paper',
      borderTop: 1,
      borderBottom: 1,
      borderColor: 'divider',
      py: { xs: 8, md: 11 },
    }}
  >
    <Container maxWidth="lg">
      <Typography id="how-booking-works" variant="h2" sx={{ maxWidth: '18ch' }}>
        How booking works
      </Typography>
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, mt: { xs: 5, md: 7 } }}>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {STEPS.map(({ title, text }, index) => (
            <Grid component="li" size={{ xs: 12, md: 4 }} key={title}>
              <Box sx={{ borderTop: 2, borderColor: 'text.primary', pt: 2.5 }}>
                <Typography
                  aria-hidden
                  sx={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: 'primary.main',
                    fontVariantNumeric: 'tabular-nums',
                    mb: 2,
                  }}
                >
                  {index + 1}
                </Typography>
                <Typography variant="h5" component="h3" sx={{ mb: 1 }}>
                  {title}
                </Typography>
                <Typography sx={{ color: 'text.secondary', maxWidth: '36ch' }}>{text}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  </Box>
);

export default HowItWorks;
