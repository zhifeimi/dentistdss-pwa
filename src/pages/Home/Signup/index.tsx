import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
  Grid,
  useTheme,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../../context/auth';
import AuthLayout from '../../../components/Home/AuthLayout';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { CredentialResponse } from '@react-oauth/google';
import { useMediaQuery } from '@mui/material';
import PasswordStrengthIndicator from '../../../components/PasswordStrengthIndicator';
import { isPasswordStrong } from '../../../utils/passwordStrength';
import useFormValidation from '../../../hooks/useFormValidation';
import GoogleAuthProvider from '../../../components/Auth/GoogleAuthProvider';
import GoogleSignInButton from '../../../components/Auth/GoogleSignInButton';
import { returnFrom, returnPathAfterLogin } from '../../../utils/returnPath';
import type { PatientSignupState } from '../../../types/routerState';

/**
 * Signup - User registration page for patients
 *
 * Features:
 * - Patient registration with email/password
 * - Google OAuth integration
 * - Form validation with password strength checking
 * - Email verification flow
 * - Responsive design with dark mode support
 */
const Signup: React.FC = () => {
  const theme = useTheme();
  const { signup, googleIdLogin } = useAuth() || {};
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const navigate = useNavigate(); // Hook for navigation
  // The protected page that sent this visitor to log in (see returnPathAfterLogin);
  // carried through verification so logging in still lands there
  const location = useLocation();
  const from = returnFrom(location.state);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const containerRef = useRef<HTMLDivElement>(null);
  const [googleButtonWidth, setGoogleButtonWidth] = useState<string>(isMobile ? '352px' : '334px');

  // Form validation hook
  const {
    handleFieldChange,
    handleFieldBlur,
    getFieldError,
    hasFieldError,
    isFormValid
  } = useFormValidation();

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

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (!firstName || !lastName) {
      return setError('First name and last name are required');
    }

    // Check password strength
    if (!isPasswordStrong(password)) {
      return setError('Please create a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters');
    }

    if (!signup) {
      return setError('Signup service not available');
    }

    setLoading(true);
    try {
      // Signing up doesn't log the patient in: they verify their email first
      await signup(email, password, firstName, lastName, 'PATIENT' as const);

      const state: PatientSignupState = { email, firstName, from };
      navigate('/verify-email-code', { state });

    } catch (err: any) {
      console.error('Signup failed:', err);
      setError(err.message || 'Failed to create an account. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse, nonce: string) => {
    try {
      setLoading(true);

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
      setError(`${err.message || 'Google signup failed'} Please retry Google sign-in.`);
    }
    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google signup failed. Please retry Google sign-in.');
  };



  return (
      <GoogleAuthProvider>
      <AuthLayout
        title="Create your account"
        subtitle="For patients. Book visits, ask Dentabot and keep your records in one place."
      >
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First name"
                name="firstName"
                autoComplete="given-name"
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last name"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setEmail(newValue);
                  handleFieldChange('email', newValue, { email: newValue, password, confirmPassword });
                }}
                onBlur={(e) => {
                  handleFieldBlur('email', e.target.value, { email: e.target.value, password, confirmPassword });
                }}
                disabled={loading}
                error={hasFieldError('email')}
                helperText={getFieldError('email')}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setPassword(newValue);
                  handleFieldChange('password', newValue, { email, password: newValue, confirmPassword });
                }}
                onBlur={(e) => {
                  handleFieldBlur('password', e.target.value, { email, password: e.target.value, confirmPassword });
                }}
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
                          {showPassword ? <VisibilityOff/> : <Visibility/>}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
            />

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={password} theme={theme}/>

            <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setConfirmPassword(newValue);
                  handleFieldChange('confirmPassword', newValue, { email, password, confirmPassword: newValue });
                }}
                onBlur={(e) => {
                  handleFieldBlur('confirmPassword', e.target.value, { email, password, confirmPassword: e.target.value });
                }}
                disabled={loading}
                error={hasFieldError('confirmPassword')}
                helperText={getFieldError('confirmPassword')}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff/> : <Visibility/>}
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
                sx={{ mt: 3, mb: 1 }}
                disabled={loading || !isFormValid(['email', 'confirmPassword'])}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>

            <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
              By creating an account, you agree to our{' '}
              <MuiLink component={RouterLink} to="/terms" target="_blank" rel="noopener">
                Terms &amp; Conditions
              </MuiLink>
            </Typography>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ px: 1, color: 'text.secondary' }}>
                or
              </Typography>
            </Divider>

            <Grid container spacing={2} sx={{justifyContent: 'center'}}>
              <Grid size={{ xs: 12 }} sx={{display: 'flex', justifyContent: 'center'}}>
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

            <Grid container sx={{mt: 4, justifyContent: 'space-between'}}>
              <Grid size={{ xs: 'auto' }}>
                <MuiLink
                    component={RouterLink}
                    to="/login"
                    state={location.state}
                    variant="body2"
                >
                  Log in instead
                </MuiLink>
              </Grid>
              <Grid size={{ xs: 'auto' }}>
                <MuiLink
                    component={RouterLink}
                    to="/signup/clinic-staff"
                    variant="body2"
                >
                  I work for a clinic
                </MuiLink>
              </Grid>
            </Grid>
          </Box>
      </AuthLayout>
      </GoogleAuthProvider>
  );
}

export default Signup;
