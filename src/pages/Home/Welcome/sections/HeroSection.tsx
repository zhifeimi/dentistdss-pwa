import React from 'react';
import { Box, Button, Chip, Container, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import GradientMesh from './GradientMesh';
import ChatPreviewCard from './ChatPreviewCard';

/**
 * HeroSection — gradient-mesh hero: eyebrow chip, headline with a
 * gradient-highlighted phrase, subcopy, CTA row, and the Dentabot product
 * preview card. No stock imagery anywhere; all visuals are code-built.
 */
const HeroSection: React.FC = () => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <GradientMesh>
      <Container maxWidth="lg" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 8, md: 12 } }}>
        <Grid container spacing={{ xs: 5, md: 6 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Chip
              label="AI Dental Assistant"
              size="small"
              sx={{
                mb: 2.5,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: 'primary.main',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 107, 255, 0.14)' : 'rgba(108, 71, 255, 0.10)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 107, 255, 0.35)' : 'rgba(108, 71, 255, 0.25)'}`,
              }}
            />
            <Typography
              variant={isSmallMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{ fontWeight: 700, letterSpacing: '-0.03em', color: 'text.primary', mb: 2 }}
            >
              Your dental clinic,{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(90deg, #6C47FF, #A98FFF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                intelligently assisted
              </Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', lineHeight: 1.75, maxWidth: 480, mb: 4 }}
            >
              Ask Dentabot anything, get guided next steps, and book trusted
              clinics — assistant-level help whenever you need it, real care
              when it matters.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                component={RouterLink}
                to="/chat"
                variant="contained"
                color="primary"
                size="large"
                fullWidth={isSmallMobile}
              >
                Ask a dental question
              </Button>
              <Button
                component={RouterLink}
                to="/find-a-clinic"
                variant="outlined"
                color="primary"
                size="large"
                fullWidth={isSmallMobile}
              >
                Find a clinic →
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChatPreviewCard />
          </Grid>
        </Grid>
      </Container>
    </GradientMesh>
  );
};

export default HeroSection;
