import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Alert,
  TextField,
  Button,
  CircularProgress,
  Stack,
  useTheme
} from '@mui/material';
import AuthLayout from '../../../components/Home/AuthLayout';
import PasswordStrengthIndicator from '../../../components/PasswordStrengthIndicator';
import authAPI from '../../../services/auth';
import { isPasswordStrong } from '../../../utils/passwordStrength';

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
  const theme = useTheme();
  const { email: initialEmail, firstName } = (location.state as LocationState) || {};

  const [email, setEmail] = useState<string>(initialEmail || '');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
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

    if (!isPasswordStrong(newPassword)) {
      setErrorMessage('Choose a strong password with uppercase, lowercase, number, and special characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!email) {
      setErrorMessage('Email address is missing. Please try signing up again.');
      return;
    }

    setVerificationStatus('verifying');

    try {
      // Call API to verify the code
      await authAPI.verifySignupWithCode(email, verificationCode, newPassword);

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
    }
  };

  if (verificationStatus === 'verifying') {
    return (
      <AuthLayout title="Verifying your email…">
        <CircularProgress aria-label="Verifying" />
      </AuthLayout>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <AuthLayout title="Email verified" subtitle="Staff and clinic admin accounts stay pending until they are approved.">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
          <CircularProgress size={18} color="inherit" />
          <Typography variant="body2">
            Opening the login page in {countdown} second{countdown !== 1 ? 's' : ''}…
          </Typography>
        </Box>
      </AuthLayout>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <AuthLayout title="Your email isn't verified yet">
        <Alert severity="error">{errorMessage}</Alert>
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
          Check the code and try again. If it keeps failing, sign up again to get a new code.
        </Typography>
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => setVerificationStatus('pending')}>
          Try again
        </Button>
      </AuthLayout>
    );
  }

  // verificationStatus === 'pending'
  return (
    <AuthLayout
      title={`Almost there${firstName ? `, ${firstName}` : ''}`}
      subtitle="Enter the email you signed up with, the 6-digit code we sent you and the password you want to use."
    >
      <Box component="form">
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrorMessage('');
            }}
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Verification code"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            slotProps={{
              htmlInput: {
                maxLength: 6,
                inputMode: 'numeric',
                pattern: '[0-9]*',
                autoComplete: 'one-time-code',
              }
            }}
            error={!!errorMessage}
            helperText={errorMessage}
          />

          <TextField
            fullWidth
            label="Choose a password"
            type="password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setErrorMessage('');
            }}
            autoComplete="new-password"
            slotProps={{ htmlInput: { maxLength: 128 } }}
          />

          <PasswordStrengthIndicator password={newPassword} theme={theme} />

          <TextField
            fullWidth
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrorMessage('');
            }}
            autoComplete="new-password"
            error={confirmPassword.length > 0 && newPassword !== confirmPassword}
            slotProps={{ htmlInput: { maxLength: 128 } }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleVerify}
            disabled={
              verificationCode.length !== 6 ||
              !isPasswordStrong(newPassword) ||
              newPassword !== confirmPassword
            }
          >
            Verify email
          </Button>
        </Stack>

        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          No code? Check your spam or junk folder, or sign up again after a few minutes.
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
