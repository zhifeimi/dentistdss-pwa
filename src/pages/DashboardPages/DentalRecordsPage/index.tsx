import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { MedicalServices as MedicalIcon } from '@mui/icons-material';
import InfoCard from '../../../components/Dashboard/shared/InfoCard';
import {
  getResponsivePadding,
  getResponsiveMargin
} from '../../../utils/mobileOptimization';

/**
 * DentalRecordsPage - Dental records page for patients
 *
 * Features:
 * - Patient dental records access
 * - Treatment history
 * - X-rays and notes (placeholder)
 * - Responsive design with mobile optimization
 */
const DentalRecordsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        <MedicalIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
        Dental Records
      </Typography>

      <Box sx={{
        '& .MuiCard-root': {
          borderRadius: { xs: 1, sm: 2 }
        }
      }}>
        <InfoCard
          title={isMobile ? "Records" : "Dental Records"}
          message="Your dental records, including treatment history, X-rays, and notes from your dentist, will be accessible here."
          severity="info"
          elevation={2}
          cardSx={{
            fontSize: { xs: '0.85rem', sm: '0.9rem' },
            '& .MuiAlert-message': {
              fontSize: 'inherit'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default DentalRecordsPage;
