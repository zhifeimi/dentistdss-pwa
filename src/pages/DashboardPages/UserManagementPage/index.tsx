import React, { useState, useEffect } from 'react';
import {
  Box,
  ListItem,
  Chip,
  Alert,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import ListCard from '../../../components/Dashboard/shared/ListCard';
import ActionButton from '../../../components/Dashboard/shared/ActionButton';
import { roleMapping } from '../../../utils/dictionary';
import {
  getResponsivePadding,
  getResponsiveMargin,
  getTouchFriendlyButtonProps,
  TOUCH_TARGETS
} from '../../../utils/mobileOptimization';
import api from '../../../services';
import { UserRole, User } from '../../../types';

interface UserManagementPageProps {
  userRole?: UserRole;
  clinicId?: string | null;
}

/**
 * UserManagementPage - Unified user/staff management page
 *
 * Features:
 * - System Users view for System Admin
 * - Staff Management view for Clinic Admin
 * - Reusable user list functionality
 * - Responsive design with mobile optimization
 */
const UserManagementPage: React.FC<UserManagementPageProps> = ({ 
  userRole = 'SYSTEM_ADMIN', 
  clinicId = null 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load users data
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError('');

      try {
        let data: User[];
        if (userRole === 'SYSTEM_ADMIN') {
          // Load all system users
          data = await api.user.getAllUsers();
        } else if (userRole === 'CLINIC_ADMIN') {
          // Load clinic staff only
          data = await api.user.getAllUsers();
          // Filter by clinic if needed
          if (clinicId) {
            data = data.filter(user => user.clinicId === Number(clinicId));
          }
        } else {
          // Return empty array for unsupported roles
          console.warn(`Unsupported user role for user management: ${userRole}`);
          data = [];
        }
        setUsers(data || []);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users. Please try again later.');
        // Set empty array on error instead of mock data
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userRole, clinicId]);

  /**
   * Render individual user item with responsive design
   */
  const renderUserItem = (user: User, index: number) => (
    <Card
      key={user.id || index}
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
          {`${user.firstName || 'Unknown'} ${user.lastName || ''}`}
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
            {user.roles
              ? user.roles.map(role => roleMapping[role] || role).join(', ')
              : 'No role assigned'
            }
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {user.email}
          </Typography>
        </Box>

        {user.clinicName && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: { xs: 1, sm: 0.5 },
              fontSize: { xs: '0.75rem', sm: '0.8rem' }
            }}
          >
            Clinic: {user.clinicName}
          </Typography>
        )}

        <Box sx={{ mt: { xs: 1, sm: 0.5 } }}>
          <Chip
            label={user.isActive !== undefined ? (user.isActive ? 'Active' : 'Inactive') : 'Active'}
            color={user.isActive !== undefined ? (user.isActive ? 'success' : 'error') : 'success'}
            size={isMobile ? "small" : "medium"}
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              height: { xs: TOUCH_TARGETS.MINIMUM - 16, sm: 'auto' }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  /**
   * Get role-specific button text
   */
  const getAddButtonText = (): string => {
    switch (userRole) {
      case 'SYSTEM_ADMIN':
        return 'Add New User';
      case 'CLINIC_ADMIN':
        return 'Add New Staff';
      default:
        return 'Add User';
    }
  };

  /**
   * Get role-specific empty message
   */
  const getEmptyMessage = (): string => {
    switch (userRole) {
      case 'SYSTEM_ADMIN':
        return 'No system users found.';
      case 'CLINIC_ADMIN':
        return 'No staff members found.';
      default:
        return 'No users found.';
    }
  };

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
          Loading users...
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
      {/* Page Header */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 2, sm: 3 },
        mb: getResponsiveMargin('medium')
      }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1.5 }
          }}
        >
          <PeopleIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          {userRole === 'SYSTEM_ADMIN' ? 'System Users' : 'Staff Management'}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          sx={{
            ...getTouchFriendlyButtonProps('medium', isMobile),
            fontSize: { xs: '0.875rem', sm: '1rem' },
            alignSelf: { xs: 'stretch', sm: 'auto' }
          }}
        >
          {isMobile ? 'Add' : getAddButtonText()}
        </Button>
      </Box>

      {/* Users List */}
      <Box sx={{
        height: 'calc(100% - 120px)',
        '& .MuiCard-root': {
          borderRadius: { xs: 1, sm: 2 }
        }
      }}>
        {users.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              '& .MuiAlert-message': {
                fontSize: 'inherit'
              }
            }}
          >
            {getEmptyMessage()}
          </Alert>
        ) : (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: getResponsiveMargin('small')
          }}>
            {users.map((user, index) => renderUserItem(user, index))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserManagementPage;
