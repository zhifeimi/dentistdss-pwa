import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import type { BlockSlotDialogProps } from '../../../../types/components';

/**
 * Dialog for blocking availability slots with reason
 */
const BlockSlotDialog: React.FC<BlockSlotDialogProps> = ({ open, onClose, onSubmit, slot, loading }) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * Reset form when dialog opens/closes
   */
  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  /**
   * Handle reason input change
   */
  const handleReasonChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setReason(event.target.value);
    if (error) {
      setError('');
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!reason.trim()) {
      setError('Please provide a reason for blocking this slot');
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
      handleClose();
    } catch (err: any) {
      console.error('Failed to block slot:', err);
      setError(err.message || 'Failed to block slot');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = (): void => {
    setReason('');
    setError('');
    setSubmitting(false);
    onClose();
  };

  /**
   * Format time for display
   */
  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Get day name from day of week number
   */
  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || '';
  };

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (submitting && reason === 'escapeKeyDown') return;
        handleClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Block Availability Slot</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {slot && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Slot Details:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {slot.isRecurring ? (
                  <>
                    <strong>Recurring:</strong> Every {getDayName(slot.dayOfWeek)}<br />
                    <strong>Time:</strong> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}<br />
                    <strong>Period:</strong> {slot.effectiveFrom} to {slot.effectiveUntil}
                  </>
                ) : (
                  <>
                    <strong>One-time:</strong> {slot.effectiveFrom}<br />
                    <strong>Time:</strong> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </>
                )}
              </Typography>
            </Box>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Reason for blocking"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={reason}
            onChange={handleReasonChange}
            error={!!error}
            helperText={error || 'Please provide a reason for blocking this availability slot'}
            disabled={submitting}
            placeholder="e.g., Personal appointment, Emergency, Vacation, etc."
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={submitting || loading}
          startIcon={submitting && <CircularProgress size={16} />}
        >
          {submitting ? 'Blocking...' : 'Block Slot'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlockSlotDialog;
