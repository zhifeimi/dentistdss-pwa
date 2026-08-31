import React, { useCallback } from 'react';
import {
  Box,
  ListItem,
  Button,
  Alert,
  DialogContentText,
} from '@mui/material';
import { useAsyncData } from '../../../hooks/dashboard/useAsyncData';
import ListCard from '../../../components/Dashboard/shared/ListCard';
import ApprovalDialog from '../../../components/Dashboard/shared/ApprovalDialog';
import useApprovalDialog from '../../../hooks/dashboard/useApprovalDialog';
import useConfirmationDialog from '../../../hooks/dashboard/useConfirmationDialog';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import {
  formatDate
} from '../../../utils/dashboard/dashboardUtils';
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
          'Approval Successful',
          `${approval.requestedRole || approval.type} for ${approval.userName} has been approved.`
        );
      } catch (error: any) {
        console.error('Error approving request:', error);
        confirmationDialog.showError(
          'Approval Failed',
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
          'Request Rejected',
          `${approval.requestedRole || approval.type} for ${approval.userName} has been rejected.`
        );
      } catch (error: any) {
        console.error('Error rejecting request:', error);
        confirmationDialog.showError(
          'Rejection Failed',
          `Failed to reject request: ${error.message}`
        );
        throw error;
      }
    }
  );

  /**
   * Render individual approval item
   */
  const renderApprovalItem = (approval: Approval, index: number) => (
    <ListItem key={approval.id || index}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: 1 }}>
          {`${approval.requestedRole || approval.type} - ${approval.userName || 'Unknown User'}`}
        </Box>
        <Box sx={{ mt: 1 }}>
          {approval.userEmail && (
            <Box sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
              Email: {approval.userEmail}
            </Box>
          )}
          {approval.clinicName && (
            <Box sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
              Clinic: {approval.clinicName}
            </Box>
          )}
          <Box sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
            Submitted: {formatDate(approval.createdAt || new Date().toISOString())}
          </Box>
        </Box>
      </Box>
      <Box sx={{ mt: { xs: 1, sm: 0 } }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => approvalDialog.openDialog(approval)}
        >
          Review
        </Button>
      </Box>
    </ListItem>
  );

  /**
   * Render approval dialog details
   */
  const renderApprovalDialogDetails = (item: Approval) => (
    <DialogContentText>
      <strong>Type:</strong> {item.requestedRole || item.type}<br />
      <strong>User:</strong> {item.userName || 'Unknown User'}<br />
      {item.userEmail && <><strong>Email:</strong> {item.userEmail}<br /></>}
      {item.clinicName && <><strong>Clinic:</strong> {item.clinicName}<br /></>}
      {item.requestReason && <><strong>Request Reason:</strong> {item.requestReason}<br /></>}
      <strong>Submitted:</strong> {formatDate(item.createdAt || new Date().toISOString())}
    </DialogContentText>
  );

  /**
   * Get role-specific title
   */
  const getDialogTitle = (): string => {
    switch (userRole) {
      case 'SYSTEM_ADMIN':
        return 'Review Approval Request';
      case 'CLINIC_ADMIN':
        return 'Review Staff Signup Request';
      default:
        return 'Review Request';
    }
  };

  if (loading) {
    return <Alert severity="info">Loading approvals...</Alert>;
  }

  if (error) {
    return <Alert severity="error">Failed to load approvals. Please try again later.</Alert>;
  }

  return (
    <Box sx={{ pt: 2, height: '100%' }}>
      <ListCard
        items={pendingApprovals || []}
        renderItem={renderApprovalItem}
        emptyMessage="No pending approvals."
      />

      {/* Approval Dialog */}
      <ApprovalDialog
        {...approvalDialog.dialogProps}
        title={getDialogTitle()}
        renderItemDetails={renderApprovalDialogDetails}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog {...confirmationDialog.dialogProps} />
    </Box>
  );
};

export default ApprovalsPage;
