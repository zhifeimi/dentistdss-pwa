import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  TextField,
  Button,
  CircularProgress,
  Stack
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import authAPI from '../../../services/auth';

type VerificationStatus = 'pending' | 'verifying' | 'success' | 'error';

interface LocationState {
  email?: string;
  firstName?: string;
}

/**
 * VerifyEmailPage - Email verification with token/code
 * 
 * Features:
 * - 6-digit verification code input
 * - Real-time validation and formatting
 * - Multiple verification states with appropriate UI
 * - Auto-redirect after successful verification
 * - Error handling with retry functionality
 * - Responsive design with clear visual feedback
 */
const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, firstName } = (location.state as LocationState) || {};

  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input and limit to 6 digits
    const input = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
    setVerificationCode(input);
  };

  const handleVerify = async () => {
    // Validate the verification code
    if (verificationCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    if (!email) {
      setErrorMessage('Email address is missing. Please try signing up again.');
      return;
    }

    setVerificationStatus('verifying');

    try {
      // Call API to verify the code
      const response = await authAPI.verifySignupWithCode(email, verificationCode);

      setVerificationStatus('success');
      console.log('Verification successful');

      // Start countdown to redirect to login page
      let timer = 3;
      const intervalId = setInterval(() => {
        timer -= 1;
        setCountdown(timer);
        if (timer === 0) {
          clearInterval(intervalId);
          navigate('/login');
        }
      }, 1000);

    } catch (error: any) {
      setVerificationStatus('error');
      const apiErrorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred during verification.';
      setErrorMessage(apiErrorMessage.includes('Invalid code') || apiErrorMessage.includes('expired')
        ? 'Verification failed: The code is invalid or has expired.'
        : apiErrorMessage);
      console.error('Verification API error:', error);
    }
  };

  if (!email || !firstName) {
    // Fallback if state is not passed correctly
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Verify Your Email
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Information missing. Please try signing up again.
          </Alert>
        </Paper>
      </Container>
    );
  }

  if (verificationStatus === 'verifying') {
    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 8, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Verifying your email...</Typography>
        </Paper>
      </Container>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'success.light' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'success.dark' }}>
            Email Verified Successfully!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            You will be redirected to the login page in {countdown} seconds...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'error.light' }}>
          <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom sx={{ color: 'error.dark' }}>
            Verification Failed
          </Typography>
          <Alert severity="error" sx={{ mb: 2, justifyContent: 'center' }}>{errorMessage}</Alert>
          <Typography variant="body1">
            Please try again or contact support if the issue persists.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => setVerificationStatus('pending')}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  // verificationStatus === 'pending'
  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3}
        sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Almost there, {firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We've sent a verification code to <strong>{email}</strong>.
          Please enter the 6-digit code below to complete your registration.
        </Typography>

        <Box component="form" sx={{ mt: 1, width: '100%', maxWidth: '360px' }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="6-Digit Verification Code"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              margin="normal"
              variant="outlined"
              placeholder="Enter 6-digit code"
              slotProps={{
                htmlInput: {
                  maxLength: 6,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }
              }}
              error={!!errorMessage}
              helperText={errorMessage}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleVerify}
              disabled={verificationCode.length !== 6}
            >
              Verify Email
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Didn't receive the code? Please check your spam or junk folder, or try signing up again after a few
            minutes.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyEmailPage;
