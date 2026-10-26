import React from 'react';
import { Box, Button, Container, Grid, Typography, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import ClinicSchedulePreview from './ClinicSchedulePreview';

const CAPABILITIES: { title: string; text: string }[] = [
  {
    title: 'Online booking',
    text: 'Patients book open times straight into your schedule. You set working hours, holidays and blocked slots.',
  },
  {
    title: 'Patient records',
    text: 'Dental records, clinical notes and images kept together, one file per patient.',
  },
  {
    title: 'AI receptionist and summaries',
    text: 'Dentabot handles routine questions, and visit notes become plain-language summaries.',
  },
  {
    title: 'Roles and approvals',
    text: 'Admins approve staff accounts and decide what dentists and receptionists can see.',
  },
];

/**
 * ForClinics — the business side, on a deep scrubs band so it reads as a
 * different audience: what a clinic gets, shown with the product itself.
 */
const ForClinics: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  // Inverted band: fixed colors in both modes, chosen against each other.
  const band = isDark ? '#0F2B26' : '#073B34';
  const onBand = '#ECF5F2';
  const onBandMuted = '#A9C9C0';
  const rule = 'rgba(236, 245, 242, 0.18)';

  return (
    <Box
      component="section"
      id="for-clinics"
      aria-labelledby="for-clinics-heading"
      sx={{ bgcolor: band, color: onBand, py: { xs: 8, md: 12 }, scrollMarginTop: 64 }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 6, md: 8 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography id="for-clinics-heading" variant="h2" sx={{ color: onBand, maxWidth: '16ch' }}>
              Run your clinic's front desk from one screen
            </Typography>
            <Typography sx={{ mt: 2.5, color: onBandMuted, fontSize: '1.125rem', maxWidth: '42ch' }}>
              Booking, schedules, patient records and an AI receptionist, shared by your whole team.
              Patients book themselves and your staff see it straight away.
            </Typography>

            <Box component="dl" sx={{ mt: 5, mb: 0 }}>
              {CAPABILITIES.map(({ title, text }) => (
                <Box key={title} sx={{ borderTop: `1px solid ${rule}`, py: 2 }}>
                  <Typography component="dt" sx={{ fontWeight: 700 }}>{title}</Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.5, color: onBandMuted }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 4, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/signup/clinic-admin"
                variant="contained"
                size="large"
                sx={{ bgcolor: onBand, color: '#073B34', '&:hover': { bgcolor: '#FFFFFF' } }}
              >
                Register your clinic
              </Button>
              <Button
                component={RouterLink}
                to="/signup/clinic-staff"
                size="large"
                sx={{ color: onBand, '&:hover': { bgcolor: 'rgba(236, 245, 242, 0.08)' } }}
              >
                Join your clinic's team
              </Button>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }} sx={{ alignSelf: 'center' }}>
            <ClinicSchedulePreview />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ForClinics;
