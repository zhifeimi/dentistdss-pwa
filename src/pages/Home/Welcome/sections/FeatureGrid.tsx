import React from 'react';
import { Box, Card, CardContent, Container, Grid, Typography, useTheme } from '@mui/material';
import {
  Chat as ChatIcon,
  CalendarMonth as CalendarIcon,
  Map as MapIcon,
  MedicalServices as TriageIcon,
  Description as SummaryIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import SectionHeader from './SectionHeader';

interface Feature {
  icon: React.ElementType;
  title: string;
  text: string;
}

const FEATURES: Feature[] = [
  { icon: ChatIcon, title: 'AI answers, day or night', text: 'Dentabot answers dental questions instantly and tells you when a symptom needs a real exam.' },
  { icon: CalendarIcon, title: 'Book online in minutes', text: 'Pick a clinic, a dentist, and a time that fits — no phone calls, no waiting rooms.' },
  { icon: MapIcon, title: 'Clinic discovery', text: 'Find trusted clinics near you with the services and availability you actually need.' },
  { icon: TriageIcon, title: 'Smart triage', text: 'Urgency-aware guidance routes you to self-care, a routine visit, or urgent attention.' },
  { icon: SummaryIcon, title: 'Clinical summaries', text: 'Visits end with clear, plain-language summaries you can keep and share.' },
  { icon: LockIcon, title: 'Private by design', text: 'Your records stay yours — least-privilege access, encrypted in transit and at rest.' },
];

/**
 * FeatureGrid — six hairline cards with violet-tinted icon chips.
 */
const FeatureGrid: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
      <SectionHeader
        eyebrow="Everything in one place"
        title="The whole dental visit, rethought"
        sub="From the first question to the chair — one system for answers, booking, and your records."
      />
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={title}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                '&:hover': {
                  boxShadow: theme.shadows[isDark ? 6 : 3],
                  transform: 'translateY(-3px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 1.25,
                    borderRadius: 2.5,
                    mb: 2,
                    color: 'primary.main',
                    bgcolor: isDark ? 'rgba(139, 107, 255, 0.14)' : 'rgba(108, 71, 255, 0.10)',
                  }}
                >
                  <Icon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>{text}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default FeatureGrid;
