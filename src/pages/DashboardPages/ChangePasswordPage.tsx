import React, { useState } from 'react';
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
    Stack,
    Divider,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../services';
import { isPasswordStrong } from '../../utils/passwordStrength';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';

interface FormData {
    newPassword: string;
    confirmPassword: string;
}

interface AlertState {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

const ChangePasswordPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [alert, setAlert] = useState<AlertState>({ show: false, type: 'info', message: '' });

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

    const validateForm = (): boolean => {
        if (!formData.newPassword) {
            setAlert({
                show: true,
                type: 'error',
                message: 'New password is required'
            });
            return false;
        }

        if (!isPasswordStrong(formData.newPassword)) {
            setAlert({
                show: true,
                type: 'error',
                message: 'Please choose a stronger password. Follow the suggestions below.'
            });
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setAlert({
                show: true,
                type: 'error',
                message: 'Passwords do not match'
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
            await api.auth.changePassword(formData.newPassword);
            setAlert({
                show: true,
                type: 'success',
                message: 'Password changed successfully!'
            });
            
            // Clear form
            setFormData({
                newPassword: '',
                confirmPassword: '',
            });

            // Navigate back to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (error: any) {
            console.error('Password change failed:', error);
            setAlert({
                show: true,
                type: 'error',
                message: error.response?.data?.message || 'Failed to change password. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(-1); // Go back to previous page
    };

    return (
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
            <Card
                elevation={2}
                sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: theme.palette.background.paper,
                }}
            >
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: 'white',
                        p: { xs: 3, sm: 4 },
                        textAlign: 'center',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '80px',
                            height: '80px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            transform: 'translate(20px, -20px)',
                        }
                    }}
                >
                    <LockResetIcon
                        sx={{
                            fontSize: { xs: 48, sm: 56 },
                            mb: 2,
                            opacity: 0.9,
                        }}
                    />
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 1 }}
                    >
                        Change Password
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ opacity: 0.9 }}
                    >
                        Secure your account with a new password
                    </Typography>
                </Box>

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
                                Security Settings
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                            >
                                Choose a strong password to protect your account
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
                            <Stack spacing={3}>
                                <Box>
                                    <TextField
                                        fullWidth
                                        name="newPassword"
                                        label="New Password"
                                        type="password"
                                        value={formData.newPassword}
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
                                    <PasswordStrengthIndicator
                                        password={formData.newPassword}
                                        theme={theme}
                                    />
                                </Box>

                                <TextField
                                    fullWidth
                                    name="confirmPassword"
                                    label="Confirm New Password"
                                    type="password"
                                    value={formData.confirmPassword}
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
                            </Stack>

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
                                    {loading ? 'Changing...' : 'Save Changes'}
                                </Button>
                            </Box>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
};

export default ChangePasswordPage;
