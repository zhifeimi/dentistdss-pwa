import React, { memo, useState, MouseEvent } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Schedule as RescheduleIcon,
  Cancel as CancelIcon,
  CheckCircle as ConfirmIcon,
  PersonOff as NoShowIcon,
  Done as CompleteIcon,
  Person as PatientIcon,
  MedicalServices as DentistIcon,
  LocationOn as ClinicIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../context/auth';
import { formatDate, formatTime, getStatusColor } from '../../../../utils/dashboard/dashboardUtils';
import type { UserRole } from '../../../../types/common';
import type { Appointment } from '../../../../types/api';

type ActionType = 'reschedule' | 'cancel' | 'confirm' | 'no-show' | 'complete' | 'details';

interface DisplayInfo {
  primaryText: string;
  secondaryText: string;
  icon: React.ReactElement;
}

interface AppointmentCardProps {
  /** Appointment object */
  appointment: Appointment;
  /** User role for display customization */
  userRole: 'PATIENT' | 'DENTIST' | 'RECEPTIONIST' | 'CLINIC_ADMIN' | 'SYSTEM_ADMIN';
  /** Callback for reschedule action */
  onReschedule?: (appointment: Appointment) => void;
  /** Callback for cancel action */
  onCancel?: (appointment: Appointment) => void;
  /** Callback for confirm action */
  onConfirm?: (appointment: Appointment) => void;
  /** Callback for mark no-show action */
  onMarkNoShow?: (appointment: Appointment) => void;
  /** Callback for complete action */
  onComplete?: (appointment: Appointment) => void;
  /** Callback for view details action */
  onViewDetails?: (appointment: Appointment) => void;
  /** Whether to show action menu */
  showActions?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * AppointmentCard - Reusable appointment display component
 *
 * Features:
 * - Role-based information display
 * - Status indicators with colors
 * - Context menu with role-based actions
 * - Responsive design
 * - Optimized with React.memo
 */
const AppointmentCard: React.FC<AppointmentCardProps> = memo(({
  appointment,
  userRole,
  onReschedule,
  onCancel,
  onConfirm,
  onMarkNoShow,
  onComplete,
  onViewDetails,
  showActions = true,
  compact = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { currentUser } = useAuth();
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleAction = (action: ActionType): void => {
    handleMenuClose();
    switch (action) {
      case 'reschedule':
        onReschedule?.(appointment);
        break;
      case 'cancel':
        onCancel?.(appointment);
        break;
      case 'confirm':
        onConfirm?.(appointment);
        break;
      case 'no-show':
        onMarkNoShow?.(appointment);
        break;
      case 'complete':
        onComplete?.(appointment);
        break;
      case 'details':
        onViewDetails?.(appointment);
        break;
      default:
        break;
    }
  };

  // Determine what information to show based on user role
  const getDisplayInfo = (): DisplayInfo => {
    // Handle both old and new API data structures
    const serviceName = appointment.serviceName || appointment.serviceType || 'Appointment';
    const dentistName = appointment.dentistName || 'Unknown';
    const patientName = appointment.patientName || 'Unknown Patient';
    const clinicName = appointment.clinicName || 'Clinic';

    switch (userRole) {
      case 'PATIENT':
        return {
          primaryText: `Dr. ${dentistName}`,
          secondaryText: clinicName,
          icon: <DentistIcon color="primary" />,
        };
      case 'DENTIST':
        return {
          primaryText: patientName,
          secondaryText: serviceName,
          icon: <PatientIcon color="primary" />,
        };
      case 'RECEPTIONIST':
      case 'CLINIC_ADMIN':
        return {
          primaryText: patientName,
          secondaryText: `Dr. ${dentistName}`,
          icon: <PatientIcon color="primary" />,
        };
      default:
        return {
          primaryText: patientName || `Dr. ${dentistName}`,
          secondaryText: serviceName,
          icon: <PatientIcon color="primary" />,
        };
    }
  };

  // Check if user can perform specific actions
  const canPerformAction = (action: ActionType): boolean => {
    if (!currentUser || !appointment) return false;

    const isOwner = appointment.patientId === currentUser.id;
    const isAssignedDentist = appointment.dentistId === currentUser.id;
    const isClinicStaff = (userRole === 'RECEPTIONIST' || userRole === 'DENTIST' || userRole === 'CLINIC_ADMIN') &&
      appointment.clinicId === currentUser.clinicId;

    switch (action) {
      case 'reschedule':
      case 'cancel':
        return isOwner || isAssignedDentist || isClinicStaff;
      case 'confirm':
      case 'no-show':
      case 'complete':
        return isAssignedDentist || isClinicStaff;
      default:
        return true;
    }
  };

  const displayInfo = getDisplayInfo();
  const statusColor = getStatusColor(appointment.status);

  return (
    <Card
      sx={{
        mb: compact ? 1 : 2,
        '&:hover': {
          boxShadow: 2,
        },
      }}
      elevation={1}
    >
      <CardContent sx={{ p: compact ? 2 : 3, '&:last-child': { pb: compact ? 2 : 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Main Content */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Icon */}
            <Box sx={{ mt: 0.5 }}>
              {displayInfo.icon}
            </Box>

            {/* Appointment Details */}
            <Box sx={{ flex: 1 }}>
              {/* Primary Information */}
              <Typography
                variant={compact ? 'body1' : 'h6'}
                sx={{ fontWeight: 'medium', mb: 0.5 }}
              >
                {displayInfo.primaryText}
              </Typography>

              {/* Secondary Information */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {displayInfo.secondaryText}
              </Typography>

              {/* Date and Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(appointment.appointmentDate || appointment.date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </Typography>
              </Box>

              {/* Service Type (if not already shown) */}
              {userRole !== 'RECEPTIONIST' && userRole !== 'CLINIC_ADMIN' && (appointment.serviceName || appointment.serviceType) && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {appointment.serviceName || appointment.serviceType}
                </Typography>
              )}

              {/* Additional Info for Staff */}
              {(userRole === 'RECEPTIONIST' || userRole === 'CLINIC_ADMIN') && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ClinicIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {appointment.serviceName || appointment.serviceType}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Status and Actions */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {/* Status Chip */}
            <Chip
              label={appointment.status}
              size="small"
              sx={{
                backgroundColor: statusColor,
                color: 'white',
                fontWeight: 'medium',
              }}
            />

            {/* Actions Menu */}
            {showActions && (
              <>
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  aria-label="appointment actions"
                >
                  <MoreIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={() => handleAction('details')}>
                    <ListItemText>View Details</ListItemText>
                  </MenuItem>

                  {canPerformAction('reschedule') && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                    <MenuItem onClick={() => handleAction('reschedule')}>
                      <ListItemIcon>
                        <RescheduleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Reschedule</ListItemText>
                    </MenuItem>
                  )}

                  {canPerformAction('confirm') && appointment.status === 'REQUESTED' && (
                    <MenuItem onClick={() => handleAction('confirm')}>
                      <ListItemIcon>
                        <ConfirmIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Confirm</ListItemText>
                    </MenuItem>
                  )}

                  {canPerformAction('complete') && appointment.status === 'CONFIRMED' && (
                    <MenuItem onClick={() => handleAction('complete')}>
                      <ListItemIcon>
                        <CompleteIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Mark Complete</ListItemText>
                    </MenuItem>
                  )}

                  {canPerformAction('no-show') && appointment.status === 'CONFIRMED' && (
                    <MenuItem onClick={() => handleAction('no-show')}>
                      <ListItemIcon>
                        <NoShowIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Mark No-Show</ListItemText>
                    </MenuItem>
                  )}

                  {canPerformAction('cancel') && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                    <>
                      <Divider />
                      <MenuItem onClick={() => handleAction('cancel')} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                          <CancelIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>Cancel</ListItemText>
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

export default AppointmentCard;
export type { AppointmentCardProps };
