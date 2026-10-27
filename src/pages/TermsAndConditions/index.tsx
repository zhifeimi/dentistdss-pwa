import React from 'react';
import { Box, Container, Link, Paper, Typography } from '@mui/material';
import { Link as RouterLink, Navigate, useLocation } from 'react-router';
import { getPrivacyFragmentId } from '../PrivacyPolicy/sections';

const TermsAndConditions: React.FC = () => {
  const location = useLocation();

  if (getPrivacyFragmentId(location.hash)) {
    return <Navigate to={{ pathname: '/privacy', search: location.search, hash: location.hash }} replace />;
  }

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, sm: 5 },
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Box component="section" aria-labelledby="terms-heading">
          <Typography component="h1" id="terms-heading" variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            Terms and Conditions
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            <Link component={RouterLink} to="/privacy">Read our Privacy Policy</Link>
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            These Terms and Conditions are between you and the DentistDSS team. By accessing or
            using DentistDSS, you agree to these terms.
          </Typography>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Your responsibilities
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            Keep your account credentials confidential, provide information you are authorized to
            share, and use the service lawfully. You are responsible for activity under your
            account. Do not rely on AI-generated content as a replacement for professional dental
            care, and seek urgent professional help for an emergency.
          </Typography>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Changes to these terms
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            We may update these terms as the service changes. We will publish the current version
            on this page. Continued use after an update takes effect constitutes acceptance of the
            revised terms.
          </Typography>
          <Typography component="p" sx={{ mb: 0, lineHeight: 1.7 }}>
            Questions about these terms can be sent to{' '}
            <Link href="mailto:dentistdss@gmail.com">dentistdss@gmail.com</Link>.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;
