import React from 'react';
import { Box, Container, Grid, Typography, useTheme } from '@mui/material';
import SectionHeader from './SectionHeader';

const STEPS: { title: string; text: string }[] = [
  { title: 'Ask Dentabot', text: 'Describe the symptom in plain words. Get an instant, careful read — not a search-result rabbit hole.' },
  { title: 'Get guided next steps', text: 'Self-care when it is safe, urgency-aware triage when it is not. You always know what to do next.' },
  { title: 'Visit a clinic', text: 'Book a trusted clinic online in minutes and walk in with your history already organized.' },
];

/**
 * HowItWorks — three numbered steps with a connecting line (desktop).
 */
const HowItWorks: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 }, borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` }}>
      <Container maxWidth="lg">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to a calmer dental visit"
        />
        <Grid container spacing={{ xs: 4, md: 3 }} sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'absolute',
              top: 28,
              left: '18%',
              right: '18%',
              height: 0,
              borderTop: `2px dashed ${theme.palette.mode === 'dark' ? 'rgba(139, 107, 255, 0.35)' : 'rgba(108, 71, 255, 0.30)'}`,
            }}
          />
          {STEPS.map(({ title, text }, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={title} sx={{ textAlign: 'center', position: 'relative' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 2.5,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 0 0 8px rgba(139, 107, 255, 0.12)'
                    : '0 0 0 8px rgba(108, 71, 255, 0.10)',
                }}
              >
                {index + 1}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: 300, mx: 'auto' }}>
                {text}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HowItWorks;
