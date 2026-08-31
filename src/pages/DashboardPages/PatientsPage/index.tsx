import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useAuth } from '../../../context/auth';
import SearchableList from '../../../components/Dashboard/shared/SearchableList';
import {
  getResponsivePadding,
  getResponsiveMargin,
  TOUCH_TARGETS
} from '../../../utils/mobileOptimization';
import api from '../../../services';

interface Patient {
  id: string | number;
  name?: string;
  patientName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  emailAddress?: string;
  lastVisit?: string;
  nextAppointment?: string;
}

/**
 * PatientsPage - Patients management page for receptionists
 *
 * Features:
 * - Patient list with search
 * - Patient information access
 * - Contact management
 * - Responsive design with mobile optimization
 */
const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { currentUser } = useAuth() || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load patients data
  useEffect(() => {
    const loadPatients = async () => {
      if (!currentUser?.clinicId) {
        setError('No clinic information available for this user.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await api.clinic.getClinicPatientRecords(currentUser.clinicId);
        setPatients(data || []);
      } catch (err) {
        console.error('Failed to load patients:', err);
        setError('Failed to load patients. Please try again later.');
        // Return empty array on error instead of mock data
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [currentUser?.clinicId]);

  /**
   * Render individual patient item with responsive design
   */
  const renderPatientItem = (patient: Patient, index: number) => (
    <Card
      key={patient.id || index}
      sx={{
        mb: getResponsiveMargin('small'),
        borderRadius: { xs: 1, sm: 2 },
        minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
      }}
    >
      <CardContent sx={{ p: getResponsivePadding('medium') }}>
        <Typography
          variant={isMobile ? "subtitle2" : "subtitle1"}
          sx={{
            fontWeight: 'medium',
            mb: { xs: 0.5, sm: 1 },
            fontSize: { xs: '1rem', sm: '1.1rem' }
          }}
        >
          {patient.name || 
           patient.patientName || 
           (patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient')}
        </Typography>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 0.5, sm: 2 },
          mb: { xs: 1, sm: 0.5 }
        }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            Phone: {patient.phone || patient.phoneNumber || 'N/A'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            Email: {patient.email || patient.emailAddress || 'N/A'}
          </Typography>
        </Box>

        {(patient.lastVisit || patient.nextAppointment) && (
          <Box sx={{
            mt: { xs: 0.5, sm: 1 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 0.25, sm: 1 }
          }}>
            {patient.lastVisit && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
              >
                Last visit: {patient.lastVisit}
              </Typography>
            )}
            {patient.nextAppointment && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
              >
                Next: {patient.nextAppointment}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

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
          Loading patients...
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
          mb: getResponsiveMargin('medium')
        }}
      >
        Patients
      </Typography>

      <SearchableList
        items={patients}
        renderItem={renderPatientItem}
        searchFields={['name', 'patientName', 'firstName', 'lastName', 'phone', 'phoneNumber', 'email', 'emailAddress']}
        emptyMessage="No patients found."
        searchPlaceholder={isMobile ? "Search patients..." : "Search patients by name, phone, or email..."}
        sx={{
          '& .MuiTextField-root': {
            minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 'auto' }
          },
          '& .MuiInputBase-input': {
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }
        }}
      />
    </Box>
  );
};

export default PatientsPage;
