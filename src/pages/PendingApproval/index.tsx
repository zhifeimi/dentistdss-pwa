import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router';
import { Box, Button, Step, StepContent, StepLabel, Stepper, Typography } from '@mui/material';
import AuthLayout from '../../components/Home/AuthLayout';
import type { Approver, PendingApprovalState } from '../../types/routerState';


const WHO_REVIEWS: Record<Approver, string> = {
  clinic: 'Your clinic admin reviews your account.',
  dentistdss: 'The DentistDSS team reviews your clinic.',
};

/**
 * PendingApproval — where staff and clinic-admin sign-ups land after
 * verifying their email. The backend rejects their logins until approval.
 */
const PendingApproval: React.FC = () => {
  const { firstName, approver } = (useLocation().state as PendingApprovalState | null) ?? {};

  return (
    <AuthLayout
      title="Waiting for approval"
      subtitle={`Your email is verified${firstName ? `, ${firstName}` : ''}. One more step before you can log in.`}
    >
      <Stepper orientation="vertical" activeStep={1}>
        <Step completed>
          <StepLabel>Verify your email</StepLabel>
        </Step>
        <Step>
          <StepLabel>Approval</StepLabel>
          <StepContent>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {(approver && WHO_REVIEWS[approver]) ??
                'Your clinic admin reviews your account, or the DentistDSS team if you registered a new clinic.'}
            </Typography>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>We email you the decision</StepLabel>
        </Step>
      </Stepper>

      <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
        Until then, the login page will say your email or password is incorrect.
      </Typography>

      <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button component={RouterLink} to="/" variant="contained">
          Back to home
        </Button>
        <Button component={RouterLink} to="/login">
          Log in
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default PendingApproval;
