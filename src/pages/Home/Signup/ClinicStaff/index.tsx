import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Link as MuiLink,
  MenuItem,
  Select,
  InputLabel,
  Alert,
  useTheme,
  InputAdornment,
  IconButton,
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
import type { ApprovalSignupState } from '../../../../types/routerState';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: string; // 'dentist' or 'receptionist'; clinic admins sign up on their own page
  clinicName: string; // Will hold the human-readable clinic name after selection
  clinicId: string; // Selected clinic ID (for dentists and receptionists)
}

interface Clinic {
  id: string;
  name: string;
}

/**
 * ClinicStaff - Clinic staff registration form
 *
 * Features:
 * - Staff registration for dentists and receptionists
 * - Dynamic clinic selection based on role
 * - Form validation with password strength checking
 * - Email verification and approval workflow
 * - Responsive design with dark mode support
 */
const ClinicStaff: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: '',
    clinicName: '', // Will hold the human-readable clinic name after selection
    clinicId: '', // Selected clinic ID (for dentists and receptionists)
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [clinics, setClinics] = useState<Clinic[]>([]); // Populated via API
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [dialogTitle, setDialogTitle] = useState<string>('');

  // Form validation hook
  const {
    handleFieldChange,
    handleFieldBlur,
    getFieldError,
    hasFieldError,
    isFormValid
  } = useFormValidation();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Fetch clinics when role requires it
  React.useEffect(() => {
    const fetchClinics = async () => {
      if (formData.role === 'dentist' || formData.role === 'receptionist') {
        try {
          const clinicsData = await api.clinic.getClinics();
          const formattedClinics = (clinicsData || []).map((c: any) => ({
            id: c.id || c.clinicId || c._id || c.uuid || '',
            name: c.name || c.clinicName || c.title || '',
          })).filter((c: Clinic) => c.id && c.name);
          setClinics(formattedClinics);
        } catch (err) {
          console.error('Failed to fetch clinics:', err);
          setClinics([]);
        }
      } else {
        setClinics([]);
      }
    };

    fetchClinics();
  }, [formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'clinicId') {
      // Also store the selected clinic name for convenience
      const selectedClinic = clinics.find(c => c.id === value);
      const newFormData = { ...formData, clinicId: value, clinicName: selectedClinic?.name || '' };
      setFormData(newFormData);
    } else {
      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);

      // Handle validation for email and password fields
      if (name === 'email' || name === 'password' || name === 'confirmPassword') {
        handleFieldChange(name, value, newFormData);
      }

      if (name === 'role') {
        // Reset clinic fields when role changes
        setFormData(prev => ({ ...prev, clinicName: '', clinicId: '' }));
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;

    if (name === 'clinicId') {
      // Also store the selected clinic name for convenience
      const selectedClinic = clinics.find(c => c.id === value);
      const newFormData = { ...formData, clinicId: value, clinicName: selectedClinic?.name || '' };
      setFormData(newFormData);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email' || name === 'password' || name === 'confirmPassword') {
      handleFieldBlur(name, value, formData);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check password strength
    if (!isPasswordStrong(formData.password)) {
      setError('Please create a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters');
      setLoading(false);
      return;
    }

    // Basic validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.role) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if ((formData.role === 'dentist' || formData.role === 'receptionist') && !formData.clinicId) {
      setError('Please select a clinic.');
      setLoading(false);
      return;
    }

    try {
      await api.auth.signupClinicStaff(
        {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role as 'DENTIST' | 'RECEPTIONIST',
          clinicName: formData.clinicName || undefined,
          clinicId: formData.clinicId ? parseInt(formData.clinicId, 10) : 0,
        }
      );

      // Accepted: the account now needs email verification, then clinic admin approval
      setDialogTitle('Sign-up submitted');
      setDialogMessage('Signup request submitted! Please check your email for verification. Your account will also require administrator approval by your clinic administrator.');
      setOpenDialog(true);

    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    const state: ApprovalSignupState = { email: formData.email, firstName: formData.firstName, approver: 'clinic' };
    navigate('/verify-email-code', { state });
  };


  return (
      <>
      <AuthLayout
        wide
        title="Join your clinic's team"
        subtitle="For dentists and receptionists. Your clinic admin approves your account before you can log in."
      >
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First name"
                    name="firstName"
                    autoComplete="first-name"
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
                    autoComplete="last-name"
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
              <Grid size={{ xs: 12 }}>
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
                <PasswordStrengthIndicator password={formData.password} theme={theme}/>
              </Grid>
              <Grid size={{ xs: 12 }}>
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
                            <IconButton
                                aria-label="toggle confirm password visibility"
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
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <FormControl
                    component="fieldset"
                    fullWidth
                >
                  <FormLabel component="legend" required>Your role</FormLabel>
                  <RadioGroup
                      row
                      aria-label="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                  >
                    <FormControlLabel value="dentist" control={<Radio color="primary"/>} label="Dentist"/>
                    <FormControlLabel value="receptionist" control={<Radio color="primary"/>} label="Receptionist"/>
                  </RadioGroup>
                </FormControl>
              </Grid>

              {(formData.role === 'dentist' || formData.role === 'receptionist') && (
                  <Grid size={{ xs: 12, md: 5 }}>
                    <FormControl
                        fullWidth
                        required
                    >
                      <InputLabel id="clinic-label">Clinic</InputLabel>
                      <Select
                          labelId="clinic-label"
                          id="clinicId"
                          name="clinicId"
                          value={formData.clinicId}
                          label="Clinic"
                          onChange={handleSelectChange}
                      >
                        {clinics.length === 0 && <MenuItem value="" disabled>Loading clinics…</MenuItem>}
                        {clinics.map((clinic) => (
                            <MenuItem key={clinic.id} value={clinic.id}>{clinic.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
              )}
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
                disabled={loading || !isFormValid(['email', 'confirmPassword'])}
            >
              {loading ? 'Sending request…' : 'Request access'}
            </Button>

            <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
              By requesting access, you agree to our{' '}
              <MuiLink component={RouterLink} to="/terms" target="_blank" rel="noopener">
                Terms &amp; Conditions
              </MuiLink>
            </Typography>

            <Grid container spacing={1} sx={{mt: 2}}>
              <Grid size={{ xs: 12, md: 6 }}>
                <MuiLink
                    component={RouterLink}
                    to="/signup"
                    variant="body2"
                >
                  Not clinic staff? Create a patient account
                </MuiLink>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{textAlign: {sm: 'right'}}}>
                <MuiLink
                    component={RouterLink}
                    to="/signup/clinic-admin"
                    variant="body2"
                >
                  Registering a new clinic?
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

export default ClinicStaff;
