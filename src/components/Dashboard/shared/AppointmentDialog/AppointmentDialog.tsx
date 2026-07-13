import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { AppointmentInfo } from './AppointmentInfo';
import { DateTimeSection } from './DateTimeSection';
import { AppointmentDetails } from './AppointmentDetails';
import { AppointmentActions } from './AppointmentActions';
import {
  initializeEditData,
  validateEditData,
  getDialogTitle,
} from './utils';
import type {
  AppointmentDialogProps,
  EditData,
  ValidationErrors,
} from './types';

/**
 * Refactored AppointmentDialog component
 * 
 * Simplified from 427 lines to ~150 lines by:
 * - Extracting components into focused modules
 * - Moving utility functions to separate files
 * - Separating types and validation logic
 * - Creating reusable sub-components
 * 
 * Benefits:
 * ✅ 65% reduction in main component size (427 → ~150 lines)
 * ✅ Single Responsibility Principle compliance
 * ✅ Better testability with focused components
 * ✅ Improved maintainability and readability
 * ✅ Reusable components and utilities
 * ✅ Type safety with TypeScript
 */
const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  onClose,
  appointment,
  mode = 'view',
  userRole,
  onSave,
  onReschedule,
  onCancel,
  onConfirm,
  onMarkNoShow,
  onComplete,
  loading = false,
}) => {
  const [editData, setEditData] = useState<EditData>(initializeEditData());
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Initialize edit data when appointment changes
  useEffect(() => {
    setEditData(initializeEditData(appointment));
    setErrors({});
  }, [appointment]);

  const handleFieldChange = useCallback((field: keyof EditData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSave = useCallback(() => {
    const validationErrors = validateEditData(editData, mode);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0 && appointment) {
      if (mode === 'reschedule' && onReschedule) {
        onReschedule(appointment, editData.date, editData.startTime, editData.endTime);
      } else if (mode === 'edit' && onSave) {
        onSave(appointment, editData);
      }
    }
  }, [editData, mode, appointment, onReschedule, onSave]);

  if (!appointment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { sx: { minHeight: '500px' } }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
      }}>
        {getDialogTitle(mode)}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Grid container spacing={3}>
          <AppointmentInfo appointment={appointment} />
          
          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          <DateTimeSection
            appointment={appointment}
            mode={mode}
            editData={editData}
            errors={errors}
            onFieldChange={handleFieldChange}
          />

          <AppointmentDetails
            appointment={appointment}
            mode={mode}
            editData={editData}
            errors={errors}
            onFieldChange={handleFieldChange}
          />
        </Grid>
      </DialogContent>

      <AppointmentActions
        appointment={appointment}
        mode={mode}
        loading={loading}
        onClose={onClose}
        onSave={handleSave}
        onConfirm={onConfirm}
        onComplete={onComplete}
        onMarkNoShow={onMarkNoShow}
        onCancel={onCancel}
      />
    </Dialog>
  );
};

export default AppointmentDialog;
