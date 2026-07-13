import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Paper,
  Link as MuiLink,
  InputAdornment,
  IconButton,
  useTheme,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import PublicIcon from '@mui/icons-material/Public';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import LanguageIcon from '@mui/icons-material/Language';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../../../../services';
import PasswordStrengthIndicator from '../../../../components/PasswordStrengthIndicator';
import { isPasswordStrong } from '../../../../utils/passwordStrength';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import useFormValidation from '../../../../hooks/useFormValidation';
import { COUNTRIES } from '../../../../utils/dictionary';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  clinicName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  businessEmail: string;
  website: string;
}

/**
 * ClinicAdmin - Clinic administrator registration form
 *
 * Features:
 * - Comprehensive clinic and admin registration
 * - Form validation with password strength checking
 * - Country selection with standardized list
 * - Email verification flow integration
 * - Approval workflow for clinic registration
 * - Responsive design with dark mode support
 */
const ClinicAdmin: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    clinicName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phoneNumber: '',
    businessEmail: '',
    website: '',
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');

  // Form validation hook
  const {
    handleFieldChange,
    handleFieldBlur,
    getFieldError,
    hasFieldError,
    isFormValid
  } = useFormValidation();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Handle validation for email, password, and website fields
    if (name === 'email' || name === 'businessEmail' || name === 'password' || name === 'confirmPassword' || name === 'website') {
      handleFieldChange(name, value, newFormData);
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name as string]: value };
    setFormData(newFormData);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email' || name === 'businessEmail' || name === 'password' || name === 'confirmPassword' || name === 'website') {
      handleFieldBlur(name, value, formData);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    // Check password strength
    if (!isPasswordStrong(formData.password)) {
      return setError('Please create a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters');
    }

    // Basic validation – ensure required fields (simple check, can be expanded)
    const requiredFields: (keyof FormData)[] = [
      'firstName',
      'lastName',
      'email',
      'password',
      'clinicName',
      'address',
      'city',
      'state',
      'zipCode',
      'country',
      'phoneNumber',
      'businessEmail',
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        return setError('Please fill in all required fields.');
      }
    }

    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        clinicName: formData.clinicName,
        clinicAddress: formData.address,
        clinicCity: formData.city,
        clinicState: formData.state,
        clinicZipCode: formData.zipCode,
        clinicCountry: formData.country,
        clinicPhone: formData.phoneNumber,
        clinicEmail: formData.businessEmail,
        clinicWebsite: formData.website,
        licenseNumber: '', // Add this field to the form if needed
        role: 'CLINIC_ADMIN' as const,
      };

      await api.auth.signupClinicAdmin(payload);

      setDialogTitle('Signup Submitted');
      setDialogMessage('Signup request submitted! Please check your email for verification. Your clinic registration is pending approval by the DentistDSS team.');
      setOpenDialog(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign up. Please try again.');
    }
    setLoading(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    navigate('/verify-email-code', {state: {email: formData.email, firstName: formData.firstName}});
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor:
            theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.15)',
      },
      '&:hover fieldset': {
        borderColor:
            theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.25)'
                : 'rgba(0, 0, 0, 0.25)',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
    },
    '& .MuiInputBase-input': {
      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : undefined,
    },
  };

  return (
      <Container component="main" maxWidth="md">
        <Paper
            elevation={3}
            sx={{
              my: 8,
              p: {xs: 3, sm: 4},
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
          <Typography
              component="h1"
              variant="h4"
              sx={{
                color:
                    theme.palette.mode === 'dark'
                        ? theme.palette.primary.light
                        : theme.palette.primary.main,
                mb: 3,
                fontWeight: 600,
              }}
          >
            Clinic Administrator Sign Up
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1, width: '100%'}}>
            <Grid container spacing={2}>
              {/* ---------- SECTION: ADMIN INFO ---------- */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{fontWeight: 500, mb: 1}}>
                  Administrator Information
                </Typography>
                <Divider sx={{mb: 2}}/>
              </Grid>
              {/* User information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasFieldError('email')}
                    helperText={getFieldError('email')}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleClickShowPassword} edge="end"
                                        sx={{color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined}}>
                              {showPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />

                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator password={formData.password} theme={theme}/>
              </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasFieldError('confirmPassword')}
                    helperText={getFieldError('confirmPassword')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleClickShowConfirmPassword} edge="end"
                                        sx={{color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined}}>
                              {showConfirmPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>

              {/* ---------- SECTION: CLINIC INFO ---------- */}
              <Grid size={{ xs: 12 }} sx={{mt: 3}}>
                <Typography variant="h6" sx={{fontWeight: 500, mb: 1}}>
                  Clinic Information
                </Typography>
                <Divider sx={{mb: 2}}/>
              </Grid>
              {/* Clinic information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="clinicName"
                    label="Clinic Name"
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="address"
                    label="Address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <HomeIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    required
                    fullWidth
                    name="city"
                    label="City or Suburb"
                    id="city"
                    value={formData.city}
                    onChange={handleChange}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    required
                    fullWidth
                    name="state"
                    label="State or Territory"
                    id="state"
                    value={formData.state}
                    onChange={handleChange}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    required
                    fullWidth
                    name="zipCode"
                    label="Postcode"
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl
                    required
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor:
                              theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(0, 0, 0, 0.15)',
                        },
                        '&:hover fieldset': {
                          borderColor:
                              theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.25)'
                                  : 'rgba(0, 0, 0, 0.25)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                      },
                      '& .MuiSelect-select': {
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : undefined,
                      },
                    }}
                >
                  <InputLabel id="country-label">Country</InputLabel>
                  <Select
                      labelId="country-label"
                      id="country"
                      name="country"
                      value={formData.country}
                      label="Country"
                      onChange={handleSelectChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <PublicIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                        </InputAdornment>
                      }
                  >
                    {COUNTRIES.map((country) => (
                        <MenuItem key={country.code} value={country.name}>
                          {country.name}
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="businessEmail"
                    label="Clinic Business Email"
                    id="businessEmail"
                    autoComplete="email"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasFieldError('businessEmail')}
                    helperText={getFieldError('businessEmail')}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="phoneNumber"
                    label="Phone Number"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <LocalPhoneIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    name="website"
                    label="Clinic Website"
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={formData.website}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasFieldError('website')}
                    helperText={getFieldError('website')}
                    slotProps={{
                      input: {
                        startAdornment: (
                            <InputAdornment position="start">
                              <LanguageIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
            </Grid>

            {error && (
                <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor:
                          theme.palette.mode === 'dark'
                              ? 'rgba(211, 47, 47, 0.15)'
                              : 'rgba(211, 47, 47, 0.05)',
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.error.main}`,
                    }}
                >
                  <Typography color="error" variant="body2" sx={{textAlign: 'center'}}>
                    {error}
                  </Typography>
                </Box>
            )}

            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.2,
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow:
                      theme.palette.mode === 'dark'
                          ? '0 4px 12px rgba(0, 100, 80, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow:
                        theme.palette.mode === 'dark'
                            ? '0 6px 16px rgba(0, 100, 80, 0.4)'
                            : '0 6px 16px rgba(0, 0, 0, 0.15)',
                  },
                }}
                disabled={loading || !isFormValid(['email', 'businessEmail', 'confirmPassword', 'website'])}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Button>

            <Typography variant="body2" sx={{textAlign: 'center', mt: 1}}>
              By clicking Sign Up, you agree to our{' '}
              <MuiLink component={RouterLink} to="/terms" target="_blank" rel="noopener" sx={{fontWeight: 500}}>
                Terms &amp; Conditions
              </MuiLink>
            </Typography>

            <Grid container sx={{mt: 2, justifyContent: 'space-between'}}>
              <Grid size={{ xs: 'auto' }}>
                <MuiLink
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                    sx={{
                      color:
                          theme.palette.mode === 'dark'
                              ? theme.palette.primary.light
                              : theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                >
                  Already have an account? Sign in
                </MuiLink>
              </Grid>
              <Grid size={{ xs: 'auto' }}>
                <MuiLink
                    component={RouterLink}
                    to="/signup/clinic-staff"
                    variant="body2"
                    sx={{
                      color:
                          theme.palette.mode === 'dark'
                              ? theme.palette.primary.light
                              : theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                >
                  Sign up as a Clinic Staff
                </MuiLink>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        <ConfirmationDialog
            open={openDialog}
            onClose={handleCloseDialog}
            title={dialogTitle}
            message={dialogMessage}
        />
      </Container>
  );
};

export default ClinicAdmin;
