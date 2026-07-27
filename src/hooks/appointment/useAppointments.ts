import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/auth';
import api from '../../services';
import type { Appointment } from '../../types/api';
import type { UserRole } from '../../types/common';

export const resolveAppointmentRole = (
  activeRole: UserRole | undefined,
  accountRoles: string[] | undefined,
): UserRole => activeRole || (accountRoles?.[0] || 'PATIENT') as UserRole;

interface UseAppointmentsReturn {
  // Data
  appointments: Appointment[];
  todaysAppointments: Appointment[];
  upcomingAppointments: Appointment[];

  // State
  loading: boolean;
  error: string;

  // Actions
  refreshAppointments: (date?: Date | null) => void;
  updateAppointment: (appointmentId: string | number, updatedData: Partial<Appointment>) => void;
  removeAppointment: (appointmentId: string | number) => void;
  addAppointment: (newAppointment: Appointment) => void;

  // Utilities
  fetchAppointments: (date?: Date | null) => Promise<void>;
}

/**
 * Custom hook for managing appointment data
 *
 * Features:
 * - Role-based appointment fetching
 * - Real-time data updates
 * - Loading and error state management
 * - Automatic refresh on date changes
 */
const useAppointments = (
  selectedDate: Date | null = null,
  activeRole?: UserRole,
): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { currentUser } = useAuth();

  // Get today's date in YYYY-MM-DD format if no date provided
  const getFormattedDate = useCallback((date: Date | null): string => {
    const targetDate = date || new Date();
    return targetDate.toISOString().split('T')[0];
  }, []);

  /**
   * Fetch appointments based on user role
   */
  const fetchAppointments = useCallback(async (date: Date | null = null): Promise<void> => {
    // Check if user is loaded and has required properties
    if (!currentUser) {
      return;
    }

    const userRole = resolveAppointmentRole(activeRole, currentUser.roles);

    if (!userRole || !currentUser.id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedDate = getFormattedDate(date);
      let appointmentData: Appointment[] = [];

      switch (userRole) {
        case 'PATIENT':
          appointmentData = await api.appointment.getPatientAppointments(currentUser.id);
          break;

        case 'DENTIST':
          appointmentData = await api.appointment.getDentistAppointments(
            currentUser.id,
            formattedDate,
          );
          break;

        case 'RECEPTIONIST':
        case 'CLINIC_ADMIN':
          if (currentUser.clinicId) {
            appointmentData = await api.appointment.getClinicAppointments(
              currentUser.clinicId,
              formattedDate,
            );
          }
          break;

        default:
          break;
      }

      setAppointments(appointmentData || []);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments. Please try again later.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [activeRole, currentUser, getFormattedDate]);

  /**
   * Refresh appointments data
   */
  const refreshAppointments = useCallback((date: Date | null = null): void => {
    fetchAppointments(date);
  }, [fetchAppointments]);

  /**
   * Update a specific appointment in the local state
   */
  const updateAppointment = useCallback(
    (appointmentId: string | number, updatedData: Partial<Appointment>): void => {
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, ...updatedData } : appointment
        )
      );
    },
    [],
  );

  /**
   * Remove an appointment from local state
   */
  const removeAppointment = useCallback((appointmentId: string | number): void => {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== appointmentId));
  }, []);

  /**
   * Add a new appointment to local state
   */
  const addAppointment = useCallback((newAppointment: Appointment): void => {
    setAppointments((prev) => [...prev, newAppointment]);
  }, []);

  // Initial load and reload when selectedDate changes
  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [fetchAppointments, selectedDate]);

  // Filter appointments for today (for dashboard overview)
  const todaysAppointments = appointments.filter((appointment) => {
    // Handle both old and new API data structures
    const dateField = appointment.appointmentDate || appointment.date;
    if (!dateField) return false;
    const appointmentDate = new Date(dateField).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return appointmentDate === today;
  });

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = appointments.filter((appointment) => {
    // Handle both old and new API data structures
    const dateField = appointment.appointmentDate || appointment.date;
    if (!dateField) return false;
    const appointmentDate = new Date(dateField);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return appointmentDate >= today && appointmentDate <= nextWeek;
  });

  return {
    // Data
    appointments,
    todaysAppointments,
    upcomingAppointments,

    // State
    loading,
    error,

    // Actions
    refreshAppointments,
    updateAppointment,
    removeAppointment,
    addAppointment,

    // Utilities
    fetchAppointments,
  };
};

export default useAppointments;
