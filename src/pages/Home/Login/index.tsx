import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link as MuiLink,
  Alert,
  Grid,
  useTheme,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../../context/auth';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { CredentialResponse } from '@react-oauth/google';
import { useMediaQuery } from '@mui/material';
import AuthLayout from '../../../components/Home/AuthLayout';
import GoogleAuthProvider from '../../../components/Auth/GoogleAuthProvider';
import GoogleSignInButton from '../../../components/Auth/GoogleSignInButton';
import { returnPathAfterLogin } from '../../../utils/returnPath';
import useFormValidation from '../../../hooks/useFormValidation';

/**
 * Login - User authentication page
 * 
 * Features:
 * - Email/password login with validation
 * - Google OAuth integration
 * - Responsive design with dark mode support
 * - Form validation and error handling
 * - Password visibility toggle
 */
const Login: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUsingEmailLogin, setIsUsingEmailLogin] = useState<boolean>(false);
  const { login, googleIdLogin } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const { validateEmail } = useFormValidation();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const containerRef = useRef<HTMLDivElement>(null);
  const [googleButtonWidth, setGoogleButtonWidth] = useState<string>(
    isSmallMobile ? '100%' : isMobile ? '374px' : '354px'
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      if (!entries || entries.length === 0) return;

      const { width } = entries[0].contentRect;
      // Subtract some padding to account for the button's internal padding
      const buttonWidth = Math.max(250, Math.floor(width));
      setGoogleButtonWidth(`${buttonWidth}px`);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Mark that user is interacting with email/password form
    setIsUsingEmailLogin(true);
    // Only validate if there's an existing error (real-time validation)
    if (emailError) {
      setEmailError(validateEmail(newEmail));
    }
  };

  const handleEmailBlur = () => {
    // Only validate on blur if user is actively using email/password login
    if (isUsingEmailLogin) {
      setEmailError(validateEmail(email));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Mark that user is interacting with email/password form
    if (!isUsingEmailLogin) {
      setIsUsingEmailLogin(true);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLoginClick = () => {
    // Clear validation errors when user interacts with Google login
    setEmailError('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Mark that user is definitely using email/password login
    setIsUsingEmailLogin(true);

    // Validate email and password
    const currentEmailError = validateEmail(email);
    setEmailError(currentEmailError);

    if (currentEmailError) {
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (!login) {
      setError('Authentication service not available');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(returnPathAfterLogin(location.state), { replace: true });
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse, nonce: string) => {
    try {
      setLoading(true);
      // Clear any email validation errors when using Google login
      setEmailError('');
      setError('');
      setIsUsingEmailLogin(false);
      
      if (!googleIdLogin) {
        throw new Error('Google login service not available');
      }
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      await googleIdLogin(credentialResponse.credential, nonce);
      navigate(returnPathAfterLogin(location.state), { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(`${err.message || 'Google login failed'} Please retry Google sign-in.`);
    }
    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please retry Google sign-in.');
  };

  return (
    <GoogleAuthProvider>
    <AuthLayout
      title="Log in"
      subtitle="Patients and clinic staff use the same login."
    >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus={!isMobile} // Disable autofocus on mobile to prevent keyboard popup
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
            slotProps={{
              htmlInput: {
                inputMode: 'email',
                type: 'email'
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ px: 1, color: 'text.secondary' }}>
              or
            </Typography>
          </Divider>

          <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                ref={containerRef}
                sx={{
                  width: '100%',
                  '.google-button': {
                    width: '100% !important',
                    marginInline: '0 !important',
                    borderRadius: '4px',
                    '& div[style]': {
                      width: '100% !important',
                      margin: '0 !important'
                    }
                  }
                }}
                onClick={handleGoogleLoginClick}
              >
                <GoogleSignInButton
                  width={googleButtonWidth}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme={theme.palette.mode === 'dark' ? 'filled_black' : 'outline'}
                />
              </Box>
            </Grid>
          </Grid>

          <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
            New to DentistDSS?{' '}
            <MuiLink component={RouterLink} to="/signup" state={location.state}>
              Create an account
            </MuiLink>
          </Typography>
        </Box>
    </AuthLayout>
    </GoogleAuthProvider>
  );
};

export default Login;
