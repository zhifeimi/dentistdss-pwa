import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
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
  Paper,
  useTheme,
  Divider,
  InputAdornment,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WorkIcon from '@mui/icons-material/Work';
import api from '../../../../services';
import PasswordStrengthIndicator from '../../../../components/PasswordStrengthIndicator';
import { isPasswordStrong } from '../../../../utils/passwordStrength';
import ConfirmationDialog from '../../../../components/ConfirmationDialog';
import useFormValidation from '../../../../hooks/useFormValidation';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: string; // 'clinic_admin', 'dentist', 'receptionist'
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
    role: '', // 'clinic_admin', 'dentist', 'receptionist'
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
      const result = await api.auth.signupClinicStaff(
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

      // If signup call completes without error, it means it's pending verification/approval.
      // The AuthContext signup function returns { emailVerificationPending: true, ... } on success.
      setDialogTitle('Signup Submitted');
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
    navigate('/verify-email-code', {state: {email: formData.email, firstName: formData.firstName}});
  };

  // Common text field styling
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
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
    '& .MuiFormHelperText-root': {
      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : undefined,
    }
  };

  return (
      <Container component="main" maxWidth="sm">
        <Paper
            elevation={3}
            sx={{
              mt: 8,
              p: {xs: 3, sm: 4},
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(42, 45, 50, 0.9)'
                  : theme.palette.background.paper,
              borderRadius: 2,
              border: theme.palette.mode === 'dark'
                  ? `1px solid ${theme.palette.divider}`
                  : 'none',
              boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
        >
          <Typography
              component="h1"
              variant="h4"
              sx={{
                color: theme.palette.mode === 'dark'
                    ? theme.palette.primary.light
                    : theme.palette.primary.main,
                mb: 3,
                fontWeight: 600
              }}
          >
            Clinic Staff Sign Up
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1, width: '100%'}}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="first-name"
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
                    autoComplete="last-name"
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
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                edge="end"
                                sx={{color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined}}
                            >
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
              <Grid size={{ xs: 12 }}>
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
                            <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={handleClickShowConfirmPassword}
                                edge="end"
                                sx={{color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined}}
                            >
                              {showConfirmPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <FormControl
                    component="fieldset"
                    fullWidth
                    sx={{
                      '& .MuiFormLabel-root': {
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                      },
                      '& .MuiFormControlLabel-root': {
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : undefined,
                      }
                    }}
                >
                  <FormLabel component="legend">
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                      <WorkIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                      <Typography component="span">Role*</Typography>
                    </Box>
                  </FormLabel>
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
                        sx={{
                          ...textFieldSx,
                          '& .MuiInputLabel-root': {
                            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                          },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                    >
                      <InputLabel id="clinic-label">Select Clinic</InputLabel>
                      <Select
                          labelId="clinic-label"
                          id="clinicId"
                          name="clinicId"
                          value={formData.clinicId}
                          label="Select Clinic"
                          onChange={handleSelectChange}
                          startAdornment={
                            <InputAdornment position="start">
                              <BusinessIcon color={theme.palette.mode === 'dark' ? 'primary' : 'action'}/>
                            </InputAdornment>
                          }
                          sx={{
                            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : undefined,
                          }}
                      >
                        {clinics.length === 0 && <MenuItem value="" disabled>Loading clinics...</MenuItem>}
                        {clinics.map((clinic) => (
                            <MenuItem key={clinic.id} value={clinic.id}>{clinic.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
              )}
            </Grid>

            {error && (
                <Box sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.05)',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.error.main}`
                }}>
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
                  boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0, 100, 80, 0.3)'
                      : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 16px rgba(0, 100, 80, 0.4)'
                        : '0 6px 16px rgba(0, 0, 0, 0.15)',
                  }
                }}
                disabled={loading || !isFormValid(['email', 'confirmPassword'])}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Button>

            <Typography variant="body2" sx={{textAlign: 'center', mt: 1}}>
              By clicking Create Account, you agree to our{' '}
              <MuiLink component={RouterLink} to="/terms" target="_blank" rel="noopener" sx={{fontWeight: 500}}>
                Terms &amp; Conditions
              </MuiLink>
            </Typography>

            <Grid container spacing={1} sx={{mt: 2}}>
              <Grid size={{ xs: 12, md: 6 }}>
                <MuiLink
                    component={RouterLink}
                    to="/signup"
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                >
                  No a staff? Sign up here
                </MuiLink>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{textAlign: {sm: 'right'}}}>
                <MuiLink
                    component={RouterLink}
                    to="/signup/clinic-admin"
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                >
                  Signup as Clinic Admin
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

export default ClinicStaff;
