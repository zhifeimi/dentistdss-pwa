import React from 'react';
import { Box, Button, DialogActions } from '@mui/material';
import { canEdit } from './utils';
import type { Appointment, DialogMode } from './types';

interface AppointmentActionsProps {
  appointment: Appointment;
  mode: DialogMode;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
  onConfirm?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onMarkNoShow?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

/**
 * AppointmentActions component
 * Handles dialog action buttons
 */
export const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  appointment,
  mode,
  loading,
  onClose,
  onSave,
  onConfirm,
  onComplete,
  onMarkNoShow,
  onCancel,
}) => {
  const isEditable = canEdit(mode);
  const isViewMode = mode === 'view';

  return (
    <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
      <Button onClick={onClose} color='inherit'>
        {isEditable ? 'Cancel' : 'Close'}
      </Button>

      <Box sx={{ flex: 1 }} />

      {isViewMode && (
        <>
          {appointment.status === 'REQUESTED' && onConfirm && (
            <Button onClick={() => onConfirm(appointment)} variant='outlined' color='success'>
              Confirm
            </Button>
          )}
          {appointment.status === 'CONFIRMED' && onComplete && (
            <Button onClick={() => onComplete(appointment)} variant='outlined' color='primary'>
              Complete
            </Button>
          )}
          {appointment.status === 'CONFIRMED' && onMarkNoShow && (
            <Button onClick={() => onMarkNoShow(appointment)} variant='outlined' color='warning'>
              No-Show
            </Button>
          )}
          {appointment.status !== 'COMPLETED' &&
            appointment.status !== 'CANCELLED' &&
            onCancel && (
            <Button onClick={() => onCancel(appointment)} variant='outlined' color='error'>
              Cancel
            </Button>
          )}
        </>
      )}

      {isEditable && (
        <Button
          onClick={onSave}
          variant='contained'
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
    </DialogActions>
  );
};
