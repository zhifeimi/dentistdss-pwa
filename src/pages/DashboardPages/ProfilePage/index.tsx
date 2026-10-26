import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  School as SchoolIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import {
  getResponsivePadding,
  getResponsiveMargin,
  TOUCH_TARGETS
} from '../../../utils/mobileOptimization';
import api from '../../../services';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';

interface DentistProfile {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
  education?: string;
}

/**
 * ProfilePage - Profile page for dentists
 *
 * Features:
 * - Dentist profile information
 * - Professional details
 * - Specializations and credentials
 * - Responsive design with mobile optimization
 */
const ProfilePage: React.FC = () => {
  const [dentistProfile, setDentistProfile] = useState<DentistProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { currentUser } = useAuth() || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Load dentist profile data
  useEffect(() => {
    const loadDentistProfile = async () => {
      if (!currentUser?.id) {
        setError('No user information available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await api.user.getProfile(currentUser.id);
        setDentistProfile(data || null);
      } catch (err) {
        console.error('Failed to load dentist profile:', err);
        setError('Failed to load profile information. Please try again later.');
        setDentistProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadDentistProfile();
  }, [currentUser?.id]);

  if (loading) {
    return (
      <Box sx={{ p: getResponsivePadding('medium') }}>
        <Alert
          severity="info"
          sx={{
            fontSize: { xs: '0.85rem', sm: '0.9rem' },
            '& .MuiAlert-message': {
              fontSize: 'inherit'
            }
          }}
        >
          Loading profile…
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: getResponsivePadding('medium') }}>
        <Alert
          severity="error"
          sx={{
            fontSize: { xs: '0.85rem', sm: '0.9rem' },
            '& .MuiAlert-message': {
              fontSize: 'inherit'
            }
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Your profile" description="Your professional details at the clinic." />

      <Grid container spacing={getResponsiveMargin('medium')}>
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: { xs: 1, sm: 2 },
              minHeight: { xs: 'auto', sm: 400 }
            }}
          >
            <CardContent sx={{ p: getResponsivePadding('large') }}>
              {dentistProfile ? (
                <Box>
                  {/* Basic Information */}
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    gutterBottom
                    sx={{
                      mb: getResponsiveMargin('medium'),
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      fontWeight: 600
                    }}
                  >
                    Basic information
                  </Typography>

                  <List dense={isMobile} sx={{ mb: getResponsiveMargin('medium') }}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: { xs: 1, sm: 1.5 },
                        minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5
                          }}>
                            <PersonIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                            >
                              Name
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: { xs: '0.9rem', sm: '1rem' },
                              fontWeight: 500,
                              ml: { xs: 2, sm: 2.5 }
                            }}
                          >
                            {dentistProfile.name || 
                             (dentistProfile.firstName && dentistProfile.lastName 
                               ? `${dentistProfile.firstName} ${dentistProfile.lastName}` 
                               : 'N/A')}
                          </Typography>
                        }
                      />
                    </ListItem>

                    <ListItem
                      sx={{
                        px: 0,
                        py: { xs: 1, sm: 1.5 },
                        minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5
                          }}>
                            <EmailIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                            >
                              Email
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: { xs: '0.9rem', sm: '1rem' },
                              fontWeight: 500,
                              ml: { xs: 2, sm: 2.5 }
                            }}
                          >
                            {dentistProfile.email || 'N/A'}
                          </Typography>
                        }
                      />
                    </ListItem>

                    <ListItem
                      sx={{
                        px: 0,
                        py: { xs: 1, sm: 1.5 },
                        minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5
                          }}>
                            <BadgeIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                            >
                              Role
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: { xs: '0.9rem', sm: '1rem' },
                              fontWeight: 500,
                              ml: { xs: 2, sm: 2.5 }
                            }}
                          >
                            {dentistProfile.role || 'N/A'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>

                  {/* Professional Information */}
                  {(dentistProfile.specialization || dentistProfile.licenseNumber || 
                    dentistProfile.experience || dentistProfile.education) && (
                    <>
                      <Divider sx={{ my: getResponsiveMargin('medium') }} />

                      <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        gutterBottom
                        sx={{
                          mb: getResponsiveMargin('medium'),
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          fontWeight: 600
                        }}
                      >
                        Professional details
                      </Typography>

                      <List dense={isMobile}>
                        {dentistProfile.specialization && (
                          <ListItem
                            sx={{
                              px: 0,
                              py: { xs: 1, sm: 1.5 },
                              minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 0.5
                                }}>
                                  <WorkIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                  >
                                    Specialization
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    fontWeight: 500,
                                    ml: { xs: 2, sm: 2.5 }
                                  }}
                                >
                                  {dentistProfile.specialization}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}

                        {dentistProfile.licenseNumber && (
                          <ListItem
                            sx={{
                              px: 0,
                              py: { xs: 1, sm: 1.5 },
                              minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 0.5
                                }}>
                                  <BadgeIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                  >
                                    License number
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    fontWeight: 500,
                                    ml: { xs: 2, sm: 2.5 }
                                  }}
                                >
                                  {dentistProfile.licenseNumber}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}

                        {dentistProfile.experience && (
                          <ListItem
                            sx={{
                              px: 0,
                              py: { xs: 1, sm: 1.5 },
                              minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 0.5
                                }}>
                                  <WorkIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                  >
                                    Years of experience
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    fontWeight: 500,
                                    ml: { xs: 2, sm: 2.5 }
                                  }}
                                >
                                  {`${dentistProfile.experience} years`}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}

                        {dentistProfile.education && (
                          <ListItem
                            sx={{
                              px: 0,
                              py: { xs: 1, sm: 1.5 },
                              minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 0.5
                                }}>
                                  <SchoolIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                  >
                                    Education
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    fontWeight: 500,
                                    ml: { xs: 2, sm: 2.5 }
                                  }}
                                >
                                  {dentistProfile.education}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}
                      </List>
                    </>
                  )}
                </Box>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    '& .MuiAlert-message': {
                      fontSize: 'inherit'
                    }
                  }}
                >
                  Profile information not available.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
