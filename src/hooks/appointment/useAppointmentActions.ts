import { useCallback, useState } from 'react';
import { useAuth } from '../../context/auth';
import api from '../../services';
import useConfirmationDialog from '../dashboard/useConfirmationDialog';
import type { Appointment } from '../../types/api';
import type { UserRole } from '../../types/common';

type AppointmentAction = 'reschedule' | 'cancel' | 'confirm' | 'no-show' | 'complete';

interface UseAppointmentActionsReturn {
  // State
  loading: boolean;

  // Actions
  rescheduleAppointment: (
    appointment: Appointment,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
  ) => Promise<boolean>;
  cancelAppointment: (appointment: Appointment, reason: string) => Promise<boolean>;
  confirmAppointment: (appointment: Appointment) => Promise<boolean>;
  markNoShow: (appointment: Appointment) => Promise<boolean>;
  completeAppointment: (appointment: Appointment) => Promise<boolean>;

  // Utilities
  hasPermission: (appointment: Appointment, action: AppointmentAction) => boolean;

  // Dialog
  confirmationDialog: any;
  showConfirmationDialog: any;
}

/**
 * Custom hook for appointment CRUD operations
 *
 * Features:
 * - Reschedule appointments
 * - Cancel appointments
 * - Mark as no-show/complete
 * - Confirm appointments
 * - Role-based permission checking
 * - Integrated confirmation dialogs
 */
const useAppointmentActions = (
  onAppointmentUpdate?: (appointmentId: string | number, updatedData: Partial<Appointment>) => void,
): UseAppointmentActionsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const { currentUser } = useAuth();
  const confirmationDialog = useConfirmationDialog();

  /**
   * Check if user has permission to modify an appointment
   */
  const hasPermission = useCallback(
    (appointment: Appointment, action: AppointmentAction): boolean => {
      if (!currentUser || !appointment) return false;

      const userRole: UserRole = (currentUser.roles?.[0] || 'PATIENT') as UserRole;
      const isOwner = appointment.patientId === currentUser.id;
      const isAssignedDentist = appointment.dentistId === currentUser.id;
      const isClinicStaff = (currentUser.roles?.includes('RECEPTIONIST') ||
        currentUser.roles?.includes('CLINIC_ADMIN')) &&
        appointment.clinicId === currentUser.clinicId;
      const isSystemAdmin = currentUser.roles?.includes('SYSTEM_ADMIN');

      if (isSystemAdmin) return true;

      switch (action) {
        case 'reschedule':
        case 'cancel':
          return isOwner || isAssignedDentist || isClinicStaff;

        case 'confirm':
        case 'no-show':
        case 'complete':
          return isAssignedDentist || isClinicStaff;

        default:
          return false;
      }
    },
    [currentUser],
  );

  /**
   * Reschedule an appointment
   */
  const rescheduleAppointment = useCallback(
    async (
      appointment: Appointment,
      newDate: string,
      newStartTime: string,
      newEndTime: string,
    ): Promise<boolean> => {
      if (!hasPermission(appointment, 'reschedule')) {
        confirmationDialog.showError(
          'Permission Denied',
          'You do not have permission to reschedule this appointment.',
        );
        return false;
      }

      setLoading(true);
      try {
        const updatedAppointment = await api.appointment.rescheduleAppointment(
          appointment.id,
          { newDate, newStartTime, newEndTime },
        );

        if (onAppointmentUpdate) {
          onAppointmentUpdate(appointment.id, updatedAppointment);
        }

        confirmationDialog.showSuccess(
          'Appointment Rescheduled',
          'The appointment has been successfully rescheduled.',
        );

        return true;
      } catch (error: any) {
        console.error('Failed to reschedule appointment:', error);
        confirmationDialog.showError(
          'Reschedule Failed',
          'Failed to reschedule the appointment. Please try again.',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [hasPermission, currentUser, onAppointmentUpdate, confirmationDialog],
  );

  /**
   * Cancel an appointment
   */
  const cancelAppointment = useCallback(
    async (appointment: Appointment, reason: string): Promise<boolean> => {
      if (!hasPermission(appointment, 'cancel')) {
        confirmationDialog.showError(
          'Permission Denied',
          'You do not have permission to cancel this appointment.',
        );
        return false;
      }

      const normalizedReason = reason.trim();
      if (!normalizedReason || normalizedReason.length > 1000) {
        confirmationDialog.showError(
          'Cancellation Reason Required',
          'Enter a cancellation reason of no more than 1000 characters.',
        );
        return false;
      }

      setLoading(true);
      try {
        const updatedAppointment = await api.appointment.cancelAppointment(
          appointment.id,
          { reason: normalizedReason },
        );

        if (onAppointmentUpdate) {
          onAppointmentUpdate(appointment.id, updatedAppointment);
        }

        confirmationDialog.showSuccess(
          'Appointment Cancelled',
          'The appointment has been successfully cancelled.',
        );

        return true;
      } catch (error: any) {
        console.error('Failed to cancel appointment:', error);
        confirmationDialog.showError(
          'Cancellation Failed',
          'Failed to cancel the appointment. Please try again.',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [hasPermission, currentUser, onAppointmentUpdate, confirmationDialog],
  );

  /**
   * Confirm an appointment
   */
  const confirmAppointment = useCallback(async (appointment: Appointment): Promise<boolean> => {
    if (!hasPermission(appointment, 'confirm')) {
      confirmationDialog.showError(
        'Permission Denied',
        'You do not have permission to confirm this appointment.',
      );
      return false;
    }

    setLoading(true);
    try {
      const updatedAppointment = await api.appointment.confirmAppointment(
        appointment.id,
      );

      if (onAppointmentUpdate) {
        onAppointmentUpdate(appointment.id, updatedAppointment);
      }

      confirmationDialog.showSuccess(
        'Appointment Confirmed',
        'The appointment has been confirmed.',
      );

      return true;
    } catch (error: any) {
      console.error('Failed to confirm appointment:', error);
      confirmationDialog.showError(
        'Confirmation Failed',
        'Failed to confirm the appointment. Please try again.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentUser, onAppointmentUpdate, confirmationDialog]);

  /**
   * Mark appointment as no-show
   */
  const markNoShow = useCallback(async (appointment: Appointment): Promise<boolean> => {
    if (!hasPermission(appointment, 'no-show')) {
      confirmationDialog.showError(
        'Permission Denied',
        'You do not have permission to mark this appointment as no-show.',
      );
      return false;
    }

    setLoading(true);
    try {
      const updatedAppointment = await api.appointment.markNoShow(appointment.id);

      if (onAppointmentUpdate) {
        onAppointmentUpdate(appointment.id, updatedAppointment);
      }

      confirmationDialog.showInfo(
        'Marked as No-Show',
        'The appointment has been marked as no-show.',
      );

      return true;
    } catch (error: any) {
      console.error('Failed to mark appointment as no-show:', error);
      confirmationDialog.showError(
        'Update Failed',
        'Failed to mark the appointment as no-show. Please try again.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, onAppointmentUpdate, confirmationDialog]);

  /**
   * Mark appointment as complete
   */
  const completeAppointment = useCallback(async (appointment: Appointment): Promise<boolean> => {
    if (!hasPermission(appointment, 'complete')) {
      confirmationDialog.showError(
        'Permission Denied',
        'You do not have permission to mark this appointment as complete.',
      );
      return false;
    }

    setLoading(true);
    try {
      const updatedAppointment = await api.appointment.completeAppointment(appointment.id);

      if (onAppointmentUpdate) {
        onAppointmentUpdate(appointment.id, updatedAppointment);
      }

      confirmationDialog.showSuccess(
        'Appointment Completed',
        'The appointment has been marked as complete.',
      );

      return true;
    } catch (error: any) {
      console.error('Failed to complete appointment:', error);
      confirmationDialog.showError(
        'Update Failed',
        'Failed to mark the appointment as complete. Please try again.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, onAppointmentUpdate, confirmationDialog]);

  return {
    // State
    loading,

    // Actions
    rescheduleAppointment,
    cancelAppointment,
    confirmAppointment,
    markNoShow,
    completeAppointment,

    // Utilities
    hasPermission,

    // Dialog
    confirmationDialog: confirmationDialog.dialogProps,
    showConfirmationDialog: confirmationDialog.showDialog,
  };
};

export default useAppointmentActions;
