import React from 'react';
import { Card, CardContent, Container, Grid, Typography, useTheme } from '@mui/material';
import { FormatQuote as QuoteIcon } from '@mui/icons-material';
import SectionHeader from './SectionHeader';

// PLACEHOLDER quotes, attributed to roles only — replace with real
// testimonials when available. Deliberately no invented names or companies.
const QUOTES: { quote: string; role: string }[] = [
  {
    quote: 'Patients arrive already knowing what to expect. Our front desk spends less time on the phone and more time on people.',
    role: 'Clinic administrator',
  },
  {
    quote: 'The triage guidance is careful — it sends urgent cases our way quickly and keeps routine questions out of the queue.',
    role: 'Receptionist',
  },
  {
    quote: 'I asked about my toothache at midnight, knew exactly what to do in the morning, and booked a visit in two minutes.',
    role: 'Patient',
  },
];

/**
 * Testimonials — role-attributed placeholder quotes (no invented names).
 */
const Testimonials: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
      <SectionHeader
        eyebrow="Early feedback"
        title="Built for clinics and the people they care for"
      />
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {QUOTES.map(({ quote, role }) => (
          <Grid size={{ xs: 12, md: 4 }} key={role}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                bgcolor: isDark ? '#1c1c21' : '#fafafa',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <QuoteIcon sx={{ color: 'primary.main', mb: 1.5, fontSize: 28 }} />
                <Typography variant="body1" sx={{ lineHeight: 1.75, mb: 2.5, fontStyle: 'italic' }}>
                  “{quote}”
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  — {role}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Testimonials;
