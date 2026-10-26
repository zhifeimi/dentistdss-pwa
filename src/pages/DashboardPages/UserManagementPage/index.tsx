import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import { Alert, Box, Chip, CircularProgress, Link, Typography } from '@mui/material';
import { roleMapping } from '../../../utils/dictionary';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import EmptyState from '../../../components/Dashboard/shared/EmptyState';
import api from '../../../services';
import { UserRole, User } from '../../../types';

interface UserManagementPageProps {
  userRole?: UserRole;
  clinicId?: string | null;
}

/**
 * UserManagementPage - Unified user/staff management page
 *
 * System admins see every account; clinic admins see their clinic's staff.
 */
const UserManagementPage: React.FC<UserManagementPageProps> = ({ 
  userRole = 'SYSTEM_ADMIN', 
  clinicId = null 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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

  const isSystemAdmin = userRole === 'SYSTEM_ADMIN';

  return (
    <>
      <PageHeader
        title={isSystemAdmin ? 'All users' : 'Your team'}
        description={
          isSystemAdmin ? (
            'Every account on DentistDSS, across all clinics.'
          ) : (
            <>
              Dentists and receptionists at your clinic. New staff sign up as clinic staff, then you approve them
              under <Link component={RouterLink} to="/approvals">Approvals</Link>.
            </>
          )
        }
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading users" />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : users.length === 0 ? (
        <EmptyState title={isSystemAdmin ? 'No users yet' : 'No staff yet'}>
          {isSystemAdmin
            ? 'Accounts show up here as people sign up.'
            : 'Staff show up here once you approve their sign-up.'}
        </EmptyState>
      ) : (
        <Box
          component="ul"
          sx={{ m: 0, p: 0, listStyle: 'none', border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
        >
          {users.map((user, index) => (
            <Box
              component="li"
              key={user.id || index}
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                '& + &': { borderTop: 1, borderColor: 'divider' },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 650 }}>
                  {`${user.firstName || 'Unknown'} ${user.lastName || ''}`.trim()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
                  {user.email}
                  {isSystemAdmin && user.clinicName ? `, ${user.clinicName}` : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2">
                  {user.roles?.length ? user.roles.map((role) => roleMapping[role] || role).join(', ') : 'No role'}
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={user.isActive === false ? 'Inactive' : 'Active'}
                  color={user.isActive === false ? 'default' : 'success'}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};

export default UserManagementPage;
