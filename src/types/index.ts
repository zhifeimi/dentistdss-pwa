// Re-export all types for easy importing
export * from './api';
export * from './auth';
export * from './common';
// Export components types with explicit naming to avoid conflicts
export type {
  AvailabilitySlot,
  AvailabilityFormData,
  AvailabilitySubmitData,
  AddAvailabilityDialogProps,
  BlockSlotDialogProps,
  CalendarEventProps,
  ClinicFormData,
  ClinicInformationFormProps,
  NotificationSettings,
  Notification as ComponentNotification,
  DashboardSection,
  DashboardState
} from './components';
