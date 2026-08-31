import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Message as MessageIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import MessageSection from '../../../components/Dashboard/shared/MessageSection';
import {
  getResponsivePadding,
  getResponsiveMargin
} from '../../../utils/mobileOptimization';

/**
 * MessagesPage - Unified messages page for all roles
 *
 * Features:
 * - Role-agnostic message center
 * - Reuses existing MessageSection component
 * - Responsive design with mobile optimization
 */
const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth() || {};
  const userId = currentUser?.uid || currentUser?.id || 'defaultUser';

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
        <MessageIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
        Messages
      </Typography>

      <Box sx={{
        height: 'calc(100% - 80px)',
        '& .MuiCard-root': {
          borderRadius: { xs: 1, sm: 2 }
        }
      }}>
        <MessageSection userId={userId} />
      </Box>
    </Box>
  );
};

export default MessagesPage;
