import React, { useCallback } from 'react';
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  DialogContentText,
  Typography,
} from '@mui/material';
import { useAsyncData } from '../../../hooks/dashboard/useAsyncData';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import EmptyState from '../../../components/Dashboard/shared/EmptyState';
import ApprovalDialog from '../../../components/Dashboard/shared/ApprovalDialog';
import useApprovalDialog from '../../../hooks/dashboard/useApprovalDialog';
import useConfirmationDialog from '../../../hooks/dashboard/useConfirmationDialog';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import {
  formatDate
} from '../../../utils/dashboard/dashboardUtils';
import { roleMapping } from '../../../utils/dictionary';
import api from '../../../services';
import { UserRole } from '../../../types';

interface ApprovalsPageProps {
  userRole?: UserRole;
  clinicId?: string | null;
}

interface Approval {
  id: string | number;
  requestedRole?: string;
  type?: string;
  userName?: string;
  userEmail?: string;
  clinicName?: string;
  requestReason?: string;
  createdAt?: string;
}

/**
 * ApprovalsPage - Unified approvals page for admin roles
 *
 * Features:
 * - System-wide approvals for System Admin
 * - Clinic-specific approvals for Clinic Admin
 * - Approval workflow management
 */
const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ 
  userRole = 'SYSTEM_ADMIN', 
  clinicId = null 
}) => {
  // Confirmation dialog management
  const confirmationDialog = useConfirmationDialog();

  // Data fetching function
  const fetchApprovals = useCallback(async (): Promise<Approval[]> => {
    if (userRole === 'SYSTEM_ADMIN') {
      // Load all pending approvals
      return await api.approval.getPendingApprovals();
    } else if (userRole === 'CLINIC_ADMIN') {
      // Load clinic-specific approvals
      return await api.approval.getPendingApprovalsForClinicAdmin(clinicId ? Number(clinicId) : 0);
    } else {
      // Return empty array for unsupported roles
      console.warn(`Unsupported user role for approvals: ${userRole}`);
      return [];
    }
  }, [userRole, clinicId]);

  // Use async data hook
  const {
    data: pendingApprovals = [],
    loading,
    error,
    setData: setPendingApprovals,
  } = useAsyncData<Approval[]>(fetchApprovals, [userRole, clinicId], {
    onError: (err: Error) => {
      console.error('Failed to load approvals:', err);
      // Return empty array on error instead of mock data
      return [];
    },
  });

  // Approval dialog management
  const approvalDialog = useApprovalDialog(
    // onApprove
    async (approval: Approval, reason?: string) => {
      try {
        await api.approval.reviewApproval(Number(approval.id), true, reason || 'Approved');
        setPendingApprovals(pendingApprovals ? pendingApprovals.filter(item => item.id !== approval.id) : []);
        confirmationDialog.showSuccess(
          'Approved',
          `${approval.requestedRole || approval.type} for ${approval.userName} has been approved.`
        );
      } catch (error: any) {
        console.error('Error approving request:', error);
        confirmationDialog.showError(
          "Couldn't approve",
          `Failed to approve request: ${error.message}`
        );
        throw error;
      }
    },
    // onReject
    async (approval: Approval, reason?: string) => {
      try {
        await api.approval.reviewApproval(Number(approval.id), false, reason || 'Rejected');
        setPendingApprovals(pendingApprovals ? pendingApprovals.filter(item => item.id !== approval.id) : []);
        confirmationDialog.showWarning(
          'Rejected',
          `${approval.requestedRole || approval.type} for ${approval.userName} has been rejected.`
        );
      } catch (error: any) {
        console.error('Error rejecting request:', error);
        confirmationDialog.showError(
          "Couldn't reject",
          `Failed to reject request: ${error.message}`
        );
        throw error;
      }
    }
  );

  const roleName = (approval: Approval) => {
    const role = approval.requestedRole || approval.type || '';
    return roleMapping[role] || role;
  };

  const renderApprovalItem = (approval: Approval, index: number) => (
    <Box
      component="li"
      key={approval.id || index}
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        '& + &': { borderTop: 1, borderColor: 'divider' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 650 }}>
          {approval.userName || 'Unknown user'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
          {[roleName(approval), approval.userEmail, approval.clinicName].filter(Boolean).join(', ')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Signed up {formatDate(approval.createdAt || new Date().toISOString())}
        </Typography>
      </Box>
      <Button variant="contained" size="small" onClick={() => approvalDialog.openDialog(approval)}>
        Review
      </Button>
    </Box>
  );

  /**
   * Render approval dialog details
   */
  const renderApprovalDialogDetails = (item: Approval) => (
    <DialogContentText>
      <strong>Role:</strong> {roleName(item)}<br />
      <strong>Name:</strong> {item.userName || 'Unknown user'}<br />
      {item.userEmail && <><strong>Email:</strong> {item.userEmail}<br /></>}
      {item.clinicName && <><strong>Clinic:</strong> {item.clinicName}<br /></>}
      {item.requestReason && <><strong>Reason:</strong> {item.requestReason}<br /></>}
      <strong>Submitted:</strong> {formatDate(item.createdAt || new Date().toISOString())}
    </DialogContentText>
  );

  /**
   * Get role-specific title
   */
  const getDialogTitle = (): string => {
    switch (userRole) {
      case 'SYSTEM_ADMIN':
        return 'Review sign-up';
      case 'CLINIC_ADMIN':
        return 'Review staff sign-up';
      default:
        return 'Review request';
    }
  };

  const isSystemAdmin = userRole === 'SYSTEM_ADMIN';

  return (
    <>
      <PageHeader
        title={isSystemAdmin ? 'Waiting for approval' : 'Staff waiting for approval'}
        description={
          isSystemAdmin
            ? 'New clinics and their admins. They can log in once you approve them.'
            : 'People who signed up to join your clinic. They can log in once you approve them.'
        }
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading approvals" />
        </Box>
      ) : error ? (
        <Alert severity="error">Approvals didn't load. Refresh the page to try again.</Alert>
      ) : !pendingApprovals?.length ? (
        <EmptyState title="Nobody is waiting">
          {isSystemAdmin ? 'New clinic sign-ups show up here.' : 'New staff sign-ups for your clinic show up here.'}
        </EmptyState>
      ) : (
        <Box
          component="ul"
          sx={{ m: 0, p: 0, listStyle: 'none', border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
        >
          {pendingApprovals.map(renderApprovalItem)}
        </Box>
      )}

      <ApprovalDialog
        {...approvalDialog.dialogProps}
        title={getDialogTitle()}
        renderItemDetails={renderApprovalDialogDetails}
      />

      <ConfirmationDialog {...confirmationDialog.dialogProps} />
    </>
  );
};

export default ApprovalsPage;
