import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Alert,
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
import { Link as RouterLink, useNavigate } from 'react-router';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../../../../services';
import PasswordStrengthIndicator from '../../../../components/PasswordStrengthIndicator';
import { isPasswordStrong } from '../../../../utils/passwordStrength';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import AuthLayout from '../../../../components/Home/AuthLayout';
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
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
        businessEmail: formData.businessEmail,
        website: formData.website,
        role: 'CLINIC_ADMIN' as const,
      };

      await api.auth.signupClinicAdmin(payload);

      setDialogTitle('Sign-up submitted');
      setDialogMessage('Signup request submitted! Please check your email for verification. Your clinic registration is pending approval by the DentistDSS team.');
      setOpenDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    }
    setLoading(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    navigate('/verify-email-code', {state: {email: formData.email, firstName: formData.firstName, approver: 'dentistdss'}});
  };

  return (
      <>
      <AuthLayout
        wide
        title="Register your clinic"
        subtitle="Set up your clinic on DentistDSS. We review each registration before the clinic goes live, then you can invite your team."
      >
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              {/* ---------- SECTION: ADMIN INFO ---------- */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  About you
                </Typography>
                <Divider sx={{mb: 2}}/>
              </Grid>
              {/* User information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First name"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last name"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasFieldError('email')}
                    helperText={getFieldError('email')}
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
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleClickShowPassword} edge="end">
                              {showPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                />

                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator password={formData.password} theme={theme}/>
              </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm password"
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
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleClickShowConfirmPassword} edge="end">
                              {showConfirmPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                />
              </Grid>

              {/* ---------- SECTION: CLINIC INFO ---------- */}
              <Grid size={{ xs: 12 }} sx={{mt: 3}}>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  About your clinic
                </Typography>
                <Divider sx={{mb: 2}}/>
              </Grid>
              {/* Clinic information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="clinicName"
                    label="Clinic name"
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
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
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    required
                    fullWidth
                    name="city"
                    label="Suburb or city"
                    id="city"
                    value={formData.city}
                    onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    required
                    fullWidth
                    name="state"
                    label="State or territory"
                    id="state"
                    value={formData.state}
                    onChange={handleChange}
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
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl
                    required
                    fullWidth
                >
                  <InputLabel id="country-label">Country</InputLabel>
                  <Select
                      labelId="country-label"
                      id="country"
                      name="country"
                      value={formData.country}
                      label="Country"
                      onChange={handleSelectChange}
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
                    label="Clinic email"
                    id="businessEmail"
                    autoComplete="email"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasFieldError('businessEmail')}
                    helperText={getFieldError('businessEmail')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    name="phoneNumber"
                    label="Phone number"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    name="website"
                    label="Website"
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={formData.website}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasFieldError('website')}
                    helperText={getFieldError('website')}
                />
              </Grid>
            </Grid>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}

            <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 1 }}
                disabled={loading || !isFormValid(['email', 'businessEmail', 'confirmPassword', 'website'])}
            >
              {loading ? 'Sending registration…' : 'Register clinic'}
            </Button>

            <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
              By registering, you agree to our{' '}
              <MuiLink component={RouterLink} to="/terms" target="_blank" rel="noopener">
                Terms &amp; Conditions
              </MuiLink>
            </Typography>

            <Grid container sx={{mt: 2, justifyContent: 'space-between'}}>
              <Grid size={{ xs: 'auto' }}>
                <MuiLink
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                >
                  Already registered? Log in
                </MuiLink>
              </Grid>
              <Grid size={{ xs: 'auto' }}>
                <MuiLink
                    component={RouterLink}
                    to="/signup/clinic-staff"
                    variant="body2"
                >
                  Joining an existing clinic?
                </MuiLink>
              </Grid>
            </Grid>
          </Box>
      </AuthLayout>
        <ConfirmationDialog
            open={openDialog}
            onClose={handleCloseDialog}
            title={dialogTitle}
            message={dialogMessage}
        />
      </>
  );
};

export default ClinicAdmin;
