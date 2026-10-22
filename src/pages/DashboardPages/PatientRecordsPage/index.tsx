import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  Alert,
  useTheme,
  useMediaQuery,
  Grid,
  Chip,
} from '@mui/material';
import {
  Assignment as RecordsIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import {
  getResponsivePadding,
  getResponsiveMargin,
  TOUCH_TARGETS
} from '../../../utils/mobileOptimization';
import api from '../../../services';

interface PatientRecord {
  id: string | number;
  patientName?: string;
  name?: string;
  lastVisit?: string;
  treatment?: string;
  notes?: string;
}

/**
 * PatientRecordsPage - Patient records page for dentists
 *
 * Features:
 * - Access to patient records
 * - Treatment history
 * - Medical notes and files
 * - Responsive design with mobile optimization
 */
const PatientRecordsPage: React.FC = () => {
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { currentUser } = useAuth() || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Load patient records data
  useEffect(() => {
    const loadPatientRecords = async () => {
      if (!currentUser?.id) {
        setError('No user information available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await api.clinic.getDentistPatientRecords(currentUser.id);
        setPatientRecords(data || []);
      } catch (err) {
        console.error('Failed to load patient records:', err);
        setError('Failed to load patient records. Please try again later.');
        // Return empty array on error instead of mock data
        setPatientRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadPatientRecords();
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
          Loading patient records...
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
    <Box sx={{
      p: getResponsivePadding('medium'),
      height: '100%',
      maxWidth: { xs: '100%', sm: '100%', md: '100%' }
    }}>
      {/* Page Title */}
      <Typography
        variant={isMobile ? "h5" : "h4"}
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          fontWeight: 600,
          mb: getResponsiveMargin('medium'),
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 }
        }}
      >
        <RecordsIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
        Patient Records
      </Typography>

      <Grid container spacing={getResponsiveMargin('medium')}>
        <Grid size={{ xs: 12 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: { xs: 1, sm: 2 },
              minHeight: { xs: 'auto', sm: 400 }
            }}
          >
            <CardContent sx={{ p: getResponsivePadding('large') }}>
              {patientRecords.length > 0 ? (
                <Box>
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    gutterBottom
                    sx={{
                      mb: getResponsiveMargin('medium'),
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      fontWeight: 600
                    }}
                  >
                    Records ({patientRecords.length})
                  </Typography>

                  <List dense={isMobile} sx={{ width: '100%' }}>
                    {patientRecords.map((record, index) => (
                      <Card
                        key={record.id || index}
                        sx={{
                          mb: getResponsiveMargin('small'),
                          borderRadius: { xs: 1, sm: 1.5 },
                          minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
                        }}
                      >
                        <CardContent sx={{ p: getResponsivePadding('medium') }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: { xs: 1, sm: 1.5 },
                            mb: { xs: 1, sm: 0.5 },
                            flexDirection: { xs: 'column', sm: 'row' }
                          }}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <PersonIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontSize: { xs: '0.9rem', sm: '1rem' },
                                  fontWeight: 600
                                }}
                              >
                                {record.patientName || record.name || 'Unknown Patient'}
                              </Typography>
                            </Box>

                            {record.lastVisit && (
                              <Chip
                                icon={<TimeIcon sx={{ fontSize: '0.8rem' }} />}
                                label={`Last visit: ${record.lastVisit}`}
                                size={isMobile ? "small" : "medium"}
                                variant="outlined"
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                  height: { xs: TOUCH_TARGETS.MINIMUM - 16, sm: 'auto' }
                                }}
                              />
                            )}
                          </Box>

                          {(record.treatment || record.notes) && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                mt: { xs: 0.5, sm: 1 },
                                ml: { xs: 0, sm: 2.5 }
                              }}
                            >
                              Notes: {record.treatment || record.notes || 'No notes available'}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </List>
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
                  No patient records available.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientRecordsPage;
