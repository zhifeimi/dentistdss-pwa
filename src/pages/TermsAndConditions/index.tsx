import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * TermsAndConditions - Legal terms and conditions page
 * 
 * Features:
 * - Comprehensive terms and conditions for DentistDSS
 * - HIPAA and GDPR compliance information
 * - Privacy policy details
 * - User responsibilities and data handling
 * - Responsive design with dark mode support
 */
const TermsAndConditions: React.FC = () => {
  const theme = useTheme();

  return (
    <Container component="main" maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: { xs: 3, sm: 4 },
          backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(42, 45, 50, 0.9)'
              : theme.palette.background.paper,
          borderRadius: 2,
          border:
            theme.palette.mode === 'dark'
              ? `1px solid ${theme.palette.divider}`
              : 'none',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3, color: theme.palette.primary.main }}>
          Terms & Conditions
        </Typography>
        <Box sx={{ px: 1 }}>
          <Typography variant="body1" component="p" sx={{ mb: 2 }}>
            These Terms and Conditions constitute a contract between you (the "Customer") and the DentistDSS Team
            ("we", "our", "us"). By accessing or using the DentistDSS services, you agree to be bound by these Terms.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, mt: 2 }}>1. Privacy & Compliance</Typography>
          <Typography variant="body2" component="p" sx={{ mb: 2 }}>
            DentistDSS is designed and operated as a HIPAA- and GDPR-compliant system. Our platform adheres to
            Australia's Privacy Act 1988, Australian Digital Health Policies (2023 - 2028), and NSW's Health Records
            Act 2002. We will never collect, store, or disclose your personal health information without your explicit
            consent. All data transfers are encrypted and access is strictly controlled in accordance with applicable
            regulations.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, mt: 2 }}>2. Data Collection</Typography>
          <Typography variant="body2" component="p" sx={{ mb: 2 }}>
            Any personal information you provide is used solely for the purpose of delivering and improving our
            services. We do not sell user data to third parties.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, mt: 2 }}>3. User Responsibilities</Typography>
          <Typography variant="body2" component="p" sx={{ mb: 2 }}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities
            that occur under your account.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, mt: 2 }}>4. Modifications</Typography>
          <Typography variant="body2" component="p" sx={{ mb: 2 }}>
            We may update these Terms from time to time. Continued use of the service after such changes constitutes
            acceptance of the new Terms.
          </Typography>
          <Typography variant="body2" component="p" sx={{ mt: 4, mb: 2 }}>
            If you have any questions about these Terms, please contact us at dentistdss@gmail.com.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;
