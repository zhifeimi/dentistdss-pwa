import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  DialogProps,
} from '@mui/material';

interface ApprovalDialogProps extends Omit<DialogProps, 'open' | 'onClose'> {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to close the dialog */
  onClose: () => void;
  /** The item being reviewed */
  selectedItem?: any;
  /** Current rejection reason text */
  rejectionReason?: string;
  /** Function to handle rejection reason changes */
  onRejectionReasonChange: (reason: string) => void;
  /** Function to handle approval */
  onApprove: (item: any) => void;
  /** Function to handle rejection */
  onReject: (item: any, reason: string) => void;
  /** Dialog title */
  title?: string;
  /** Function to render item details - receives (item) */
  renderItemDetails?: (item: any) => React.ReactNode;
  /** Text for approve button */
  approveText?: string;
  /** Text for reject button */
  rejectText?: string;
  /** Text for cancel button */
  cancelText?: string;
  /** Label for rejection reason field */
  rejectionReasonLabel?: string;
  /** Whether actions are disabled */
  disabled?: boolean;
}

/**
 * ApprovalDialog - A reusable dialog for approval/rejection workflows
 *
 * Features:
 * - Flexible content rendering through render prop
 * - Built-in rejection reason input
 * - Consistent approval/rejection actions
 * - Proper accessibility attributes
 */
const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  onClose,
  selectedItem,
  rejectionReason = '',
  onRejectionReasonChange,
  onApprove,
  onReject,
  title = 'Review Request',
  renderItemDetails,
  approveText = 'Approve',
  rejectText = 'Reject',
  cancelText = 'Cancel',
  rejectionReasonLabel = 'Reason for rejecting (optional)',
  disabled = false,
  ...otherProps
}) => {
  if (!selectedItem) return null;

  const handleApprove = () => {
    onApprove(selectedItem);
  };

  const handleReject = () => {
    onReject(selectedItem, rejectionReason);
  };

  const handleRejectionReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRejectionReasonChange(event.target.value);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="approval-dialog-title"
      {...otherProps}
    >
      <DialogTitle id="approval-dialog-title">
        {title}
      </DialogTitle>
      
      <DialogContent>
        {/* Render item details */}
        {renderItemDetails && (
          <Box sx={{ mb: 2 }}>
            {renderItemDetails(selectedItem)}
          </Box>
        )}
        
        {/* Rejection reason input */}
        <TextField
          autoFocus
          margin="dense"
          id={`rejectionReason-${selectedItem.id}`}
          label={rejectionReasonLabel}
          type="text"
          fullWidth
          variant="standard"
          value={rejectionReason}
          onChange={handleRejectionReasonChange}
          multiline
          rows={2}
          sx={{ mt: 2 }}
          placeholder="Optional: Provide a reason for rejection"
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={disabled}
        >
          {cancelText}
        </Button>
        
        <Button 
          onClick={handleReject} 
          color="error" 
          variant="outlined"
          disabled={!selectedItem || disabled}
        >
          {rejectText}
        </Button>
        
        <Button 
          onClick={handleApprove} 
          color="primary" 
          variant="contained"
          disabled={!selectedItem || disabled}
        >
          {approveText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalDialog;
