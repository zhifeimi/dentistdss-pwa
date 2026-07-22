import React, { useState, useEffect } from 'react';
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
  Stack,
  useTheme
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PasswordStrengthIndicator from '../../../components/PasswordStrengthIndicator';
import authAPI from '../../../services/auth';
import { isPasswordStrong } from '../../../utils/passwordStrength';

const MAX_RESEND_ATTEMPTS = 3;
const RESEND_WINDOW_SECONDS = 90;
const LOCAL_STORAGE_RESEND_KEY = 'resendVerificationStatus';

interface LocationState {
  email?: string;
  firstName?: string;
}

interface ResendStatus {
  attempts: number;
  timestamp: number;
}

/**
 * VerifyEmailWithCodePage - Email verification with resend functionality
 * 
 * Features:
 * - 6-digit verification code input with validation
 * - Resend code functionality with rate limiting
 * - Persistent resend attempt tracking in localStorage
 * - Cooldown timer for rate limiting
 * - Success state with auto-redirect
 * - Comprehensive error handling
 * - Responsive design with clear visual feedback
 */
const VerifyEmailWithCodePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { email: initialEmail, firstName: initialFirstName } = (location.state as LocationState) || {};

  // Persist email and firstName in local state to survive potential state loss on refresh
  const [email, setEmail] = useState<string | undefined>(initialEmail);
  const [firstName, setFirstName] = useState<string | undefined>(initialFirstName);

  const [verificationCode, setVerificationCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loadingVerify, setLoadingVerify] = useState<boolean>(false);
  const [loadingResend, setLoadingResend] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resendMessage, setResendMessage] = useState<string>('');
  const [resendError, setResendError] = useState<string>('');
  const [resendDisabled, setResendDisabled] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(2);

  // Effect to update local email/firstName if location.state changes
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialFirstName) setFirstName(initialFirstName);
  }, [initialEmail, initialFirstName]);

  useEffect(() => {
    const now = Date.now();
    const storedStatus = localStorage.getItem(LOCAL_STORAGE_RESEND_KEY);
    if (storedStatus) {
      try {
        const status: ResendStatus = JSON.parse(storedStatus);
        if (status.timestamp) {
          const timePassedSeconds = (now - status.timestamp) / 1000;
          if (timePassedSeconds <= RESEND_WINDOW_SECONDS) {
            if (status.attempts >= MAX_RESEND_ATTEMPTS) {
              const timeLeft = Math.ceil(RESEND_WINDOW_SECONDS - timePassedSeconds);
              setResendDisabled(true);
              setResendCooldown(timeLeft);
              setResendError(`Too many attempts. Try again in ${timeLeft} seconds.`);
            }
          } else {
            localStorage.removeItem(LOCAL_STORAGE_RESEND_KEY);
          }
        }
      } catch (error) {
        console.error('Error parsing resend status from localStorage:', error);
        localStorage.removeItem(LOCAL_STORAGE_RESEND_KEY);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      setResendDisabled(true);
      timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            setResendError('');
            localStorage.removeItem(LOCAL_STORAGE_RESEND_KEY);
            return 0;
          }
          setResendError(`Too many attempts. Try again in ${prev - 1} seconds.`);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (showSuccessMessage && countdown > 0) {
      countdownTimer = setTimeout(() => {
        setCountdown(prevCountdown => prevCountdown - 1);
      }, 1000);
    } else if (showSuccessMessage && countdown === 0) {
      navigate('/login?verified=true');
    }
    return () => clearTimeout(countdownTimer);
  }, [showSuccessMessage, countdown, navigate]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
    setVerificationCode(input);
    setError(''); // Clear error when user types
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      setError('Choose a strong password with uppercase, lowercase, number, and special characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please try signing up again.');
      return;
    }

    setLoadingVerify(true);
    setError('');
    setResendMessage('');
    setResendError('');

    try {
      await authAPI.verifySignupWithCode(email, verificationCode, newPassword);
      localStorage.removeItem(LOCAL_STORAGE_RESEND_KEY); // Clear resend limit on successful verification
      setShowSuccessMessage(true);
      setCountdown(3); // Reset countdown
      // Clear other messages/errors
      setError('');
      setResendMessage('');
      setResendError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred during verification.');
    }
    setLoadingVerify(false);
  };

  const handleResendCode = async () => {
    if (!email) {
      setResendError('Email address not found. Cannot resend code.');
      return;
    }

    const now = Date.now();
    let currentStatus: ResendStatus | null = null;
    
    try {
      const storedStatus = localStorage.getItem(LOCAL_STORAGE_RESEND_KEY);
      if (storedStatus) {
        currentStatus = JSON.parse(storedStatus);
      }
    } catch (error) {
      console.error('Error parsing resend status:', error);
      localStorage.removeItem(LOCAL_STORAGE_RESEND_KEY);
    }

    if (currentStatus && currentStatus.timestamp && (now - currentStatus.timestamp) / 1000 > RESEND_WINDOW_SECONDS) {
      currentStatus = null; // Window expired, reset status
      localStorage.removeItem(LOCAL_STORAGE_RESEND_KEY);
    }

    if (currentStatus && currentStatus.attempts >= MAX_RESEND_ATTEMPTS) {
      const timeLeft = Math.ceil(RESEND_WINDOW_SECONDS - (now - currentStatus.timestamp) / 1000);
      setResendError(`Too many attempts. Try again in ${timeLeft} seconds.`);
      setResendDisabled(true);
      setResendCooldown(timeLeft);
      return;
    }

    setLoadingResend(true);
    setError('');
    setResendMessage('');
    setResendError('');
    
    try {
      const response = await authAPI.resendVerificationCode(email);
      const attempts = (currentStatus?.attempts || 0) + 1;
      const newTimestamp = currentStatus?.timestamp || now;
      
      localStorage.setItem(LOCAL_STORAGE_RESEND_KEY, JSON.stringify({
        attempts: attempts,
        timestamp: newTimestamp
      }));
      
      setResendMessage(
        typeof response === 'string'
          ? response
          : response?.dataObject ||
            'If verification is available, use your current code or check your email for a code.'
      );
      
      if (attempts >= MAX_RESEND_ATTEMPTS) {
        setResendError(`Max resend attempts reached. Try again in ${RESEND_WINDOW_SECONDS} seconds.`);
        setResendDisabled(true);
        setResendCooldown(RESEND_WINDOW_SECONDS);
      }
    } catch (err: any) {
      setResendError(err.response?.data?.message || err.message || 'An error occurred while resending the code.');
    }
    setLoadingResend(false);
  };

  if (showSuccessMessage) {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{
          p: { xs: 2, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Verification Successful!
          </Typography>
          <Typography variant="h6" component="p" sx={{ mb: 1 }}>
            Welcome aboard{firstName ? `, ${firstName}` : ''}!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your email is verified. Staff and clinic administrator accounts remain pending until approved.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
          </Typography>
          <CircularProgress sx={{ mt: 2 }} />
        </Paper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{
        p: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Verify Your Email{firstName ? `, ${firstName}` : ''}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Enter the email address used to sign up, your 6-digit code, and the password you want to use.
        </Typography>

        <Box component="form" onSubmit={handleVerify} sx={{ width: '100%', maxWidth: '300px' }}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            type="email"
            value={email || ''}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            autoComplete="email"
            disabled={loadingVerify || loadingResend}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            id="verificationCode"
            name="verificationCode"
            label="Verification Code"
            variant="outlined"
            value={verificationCode}
            onChange={handleCodeChange}
            slotProps={{
              htmlInput: { maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' } },
            }}
            error={!!error}
            helperText={error}
            disabled={loadingVerify || loadingResend}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            id="newPassword"
            name="newPassword"
            label="Choose Your Password"
            type="password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setError('');
            }}
            autoComplete="new-password"
            slotProps={{ htmlInput: { maxLength: 128 } }}
            disabled={loadingVerify || loadingResend}
            sx={{ mb: 1 }}
          />

          <PasswordStrengthIndicator password={newPassword} theme={theme} />

          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError('');
            }}
            autoComplete="new-password"
            error={confirmPassword.length > 0 && newPassword !== confirmPassword}
            slotProps={{ htmlInput: { maxLength: 128 } }}
            disabled={loadingVerify || loadingResend}
            sx={{ mb: 2 }}
          />

          {resendMessage && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{resendMessage}</Alert>}
          {resendError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{resendError}</Alert>}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={
              loadingVerify ||
              loadingResend ||
              verificationCode.length !== 6 ||
              !isPasswordStrong(newPassword) ||
              newPassword !== confirmPassword
            }
            sx={{ mb: 2, py: 1.5 }}
          >
            {loadingVerify ? <CircularProgress size={24} color="inherit" /> : 'Verify Account'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={handleResendCode}
            disabled={loadingVerify || loadingResend || resendDisabled}
          >
            {loadingResend ? <CircularProgress size={24} color="inherit" /> :
              resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Verification Code'
            }
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
          If you don't see the email, please check your spam or junk folder.
        </Typography>
      </Paper>
    </Container>
  );
};

export default VerifyEmailWithCodePage;
