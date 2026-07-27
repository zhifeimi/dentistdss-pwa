import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Container,
    useTheme,
    Grid,
    Divider,
    Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../context/auth';
import api from '../../services';

interface FormData {
    firstName: string;
    lastName: string;
    dateOfBirth: Dayjs | null;
    phone: string;
    address: string;
}

interface AlertState {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

const UserProfilePage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        dateOfBirth: null,
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [alert, setAlert] = useState<AlertState>({ show: false, type: 'info', message: '' });

    // Initialize form with current user data
    useEffect(() => {
        if (currentUser) {
            setFormData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                dateOfBirth: currentUser.dateOfBirth ? dayjs(currentUser.dateOfBirth) : null,
                phone: currentUser.phone || '',
                address: currentUser.address || '',
            });
        }
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear alert when user starts typing
        if (alert.show) {
            setAlert({ show: false, type: 'info', message: '' });
        }
    };

    const handleDateChange = (newDate: Dayjs | null) => {
        setFormData(prev => ({
            ...prev,
            dateOfBirth: newDate
        }));
        // Clear alert when user changes date
        if (alert.show) {
            setAlert({ show: false, type: 'info', message: '' });
        }
    };

    const validateForm = (): boolean => {
        if (!formData.firstName.trim()) {
            setAlert({
                show: true,
                type: 'error',
                message: 'First name is required'
            });
            return false;
        }

        if (!formData.lastName.trim()) {
            setAlert({
                show: true,
                type: 'error',
                message: 'Last name is required'
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const userId = currentUser?.uid || currentUser?.id;
            if (!userId) {
                throw new Error('User ID not available');
            }

            // Format the data for API submission
            const submitData = {
                ...formData,
                dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.format('YYYY-MM-DD') : undefined
            };

            await api.user.updateProfile(Number(userId), submitData);

            setAlert({
                show: true,
                type: 'success',
                message: 'Profile updated successfully! Please refresh the page to see changes.'
            });

            // Navigate back to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (error: any) {
            console.error('Profile update failed:', error);
            setAlert({
                show: true,
                type: 'error',
                message: error.response?.data?.message || 'Failed to update profile. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(-1); // Go back to previous page
    };

    if (!currentUser) {
        return (
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Alert severity="warning">
                    Please log in to access your profile.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
            <Grid container spacing={3}>
                {/* Profile Form Card */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card
                        elevation={2}
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography
                                        variant="h6"
                                        component="h2"
                                        gutterBottom
                                        sx={{
                                            fontWeight: 600,
                                            color: 'text.primary',
                                            mb: 1
                                        }}
                                    >
                                        Personal Information
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 3 }}
                                    >
                                        Update your personal details and contact information
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                </Box>

                                {alert.show && (
                                    <Alert
                                        severity={alert.type}
                                        sx={{ mb: 2 }}
                                        onClose={() => setAlert({ show: false, type: 'info', message: '' })}
                                    >
                                        {alert.message}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSubmit} noValidate>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                fullWidth
                                                name="firstName"
                                                label="First Name"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'primary.main',
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                fullWidth
                                                name="lastName"
                                                label="Last Name"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'primary.main',
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="Date of Birth"
                                                    value={formData.dateOfBirth}
                                                    onChange={(value) => handleDateChange(value as Dayjs | null)}
                                                    disabled={loading}
                                                    maxDate={dayjs().subtract(1, 'year')}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            variant: 'outlined',
                                                            sx: {
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: 2,
                                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: 'primary.main',
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                fullWidth
                                                name="phone"
                                                label="Phone Number"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'primary.main',
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                fullWidth
                                                name="address"
                                                label="Address"
                                                multiline
                                                rows={3}
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'primary.main',
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                    </Grid>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 2,
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            justifyContent: 'flex-end',
                                            mt: 4,
                                            pt: 3,
                                            borderTop: `1px solid ${theme.palette.divider}`,
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            onClick={handleCancel}
                                            disabled={loading}
                                            startIcon={<CancelIcon />}
                                            sx={{
                                                minHeight: 48,
                                                borderRadius: 2,
                                                px: 3,
                                                order: { xs: 2, sm: 1 },
                                                borderColor: 'grey.300',
                                                color: 'text.secondary',
                                                '&:hover': {
                                                    borderColor: 'grey.400',
                                                    bgcolor: 'grey.50',
                                                },
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={loading}
                                            startIcon={loading ? null : <SaveIcon />}
                                            sx={{
                                                minHeight: 48,
                                                borderRadius: 2,
                                                px: 3,
                                                order: { xs: 1, sm: 2 },
                                                position: 'relative',
                                                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                                                boxShadow: `0 3px 5px 2px ${theme.palette.primary.main}30`,
                                                '&:hover': {
                                                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                                                },
                                            }}
                                        >
                                            {loading && (
                                                <CircularProgress
                                                    size={20}
                                                    sx={{
                                                        position: 'absolute',
                                                        left: '50%',
                                                        top: '50%',
                                                        marginLeft: '-10px',
                                                        marginTop: '-10px',
                                                        color: 'white',
                                                    }}
                                                />
                                            )}
                                            {loading ? 'Updating...' : 'Update'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default UserProfilePage;
