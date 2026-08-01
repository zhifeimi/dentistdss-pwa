import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';

const STATS: { value: string; label: string }[] = [
  { value: '24/7', label: 'AI assistance whenever symptoms strike' },
  { value: '4', label: 'AI assistants — help, clinical, triage, summaries' },
  { value: '100%', label: 'Online booking, no phone calls required' },
  { value: '1', label: 'Record — every visit, kept in one place' },
];

/**
 * StatsBand — solid violet band with product-fact stats (no invented
 * usage numbers).
 */
const StatsBand: React.FC = () => (
  <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: { xs: 6, md: 8 } }}>
    <Container maxWidth="lg">
      <Grid container spacing={{ xs: 4, md: 3 }}>
        {STATS.map(({ value, label }) => (
          <Grid size={{ xs: 6, md: 3 }} key={value} sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.5 }}>
              {label}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);

export default StatsBand;
