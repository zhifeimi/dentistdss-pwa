/**
 * Component prop interfaces and UI-related types
 */

import { ReactNode } from 'react';
import {
  Clinic,
  SystemSetting,
  SystemSettingData,
  SystemSettingValidationErrors
} from './api';

// Dark mode hook return type
export interface UseDarkModeReturn {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

// Dashboard context types
export interface DashboardSection {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  component?: React.ComponentType<any>;
}

export interface DashboardState {
  activeRoleKey: string | null;
  activeRoleSections: DashboardSection[];
  currentSection: DashboardSection | null;
  roleRoutes: any[];
  rolesWithComponents: any[];
  mobileOpen: boolean;
  userMenuAnchorEl: HTMLElement | null;
  isLoading: boolean;
  error: string | null;
}

export interface SettingFormProps {
  onSave: (settingData: SystemSettingData) => Promise<void>;
  errors?: SystemSettingValidationErrors;
  saving?: boolean;
  isKeyExists: (key: string, excludeId?: number | null) => boolean;
}

export interface SettingItemProps {
  setting: SystemSetting;
  onSave: (settingData: SystemSettingData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
  onEdit: (setting: SystemSetting) => void;
  errors?: SystemSettingValidationErrors;
  saving?: boolean;
}

// System Settings hook return type
export interface UseSystemSettingsReturn {
  settings: SystemSetting[];
  loading: boolean;
  saving: boolean;
  error: string;
  saveSetting: (settingData: SystemSettingData) => Promise<void>;
  validateSetting: (settingData: SystemSettingData) => SystemSettingValidationErrors;
  isKeyExists: (key: string, excludeId?: number | null) => boolean;
  getSettingByKey: (key: string) => SystemSetting | null;
  refreshSettings: () => void;
  clearError: () => void;
}

// Clinic Information Form types
export interface ClinicFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  email: string;
}

export interface ClinicInformationFormProps {
  clinicData?: Clinic;
  onUpdate?: (updatedClinic: Clinic) => void;
}

// Schedule component types
export interface AvailabilitySlot {
  id: string | number;
  dentistId: string | number;
  clinicId?: string | number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveUntil: string;
  isBlocked: boolean;
  isActive: boolean;
  blockReason?: string;
}

export interface AvailabilityFormData {
  isRecurring: boolean;
  dayOfWeek: number;
  startTime: Date | null;
  endTime: Date | null;
  effectiveFrom: Date;
  effectiveUntil: Date;
}

export interface AvailabilitySubmitData {
  isRecurring: boolean;
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
}

export interface AddAvailabilityDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AvailabilitySubmitData) => Promise<void>;
  loading?: boolean;
}

export interface BlockSlotDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  slot: AvailabilitySlot | null;
  loading?: boolean;
}

export interface CalendarEventProps {
  event: {
    title: string;
    resource: AvailabilitySlot;
  };
}

// Notification System types
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  sms: boolean;
  types: {
    appointment: boolean;
    medical: boolean;
    patient: boolean;
    system: boolean;
    payment: boolean;
    security: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'appointment' | 'medical' | 'patient' | 'system' | 'payment' | 'security' | 'warning' | 'error' | 'success' | 'info';
  timestamp: Date;
  read: boolean;
  urgent?: boolean;
  category?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface SnackbarNotification {
  id: number;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  autoHideDuration?: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  snackbars: SnackbarNotification[];
  unreadCount: number;
  urgentCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Partial<Notification>) => void;
  addSnackbar: (snackbar: Partial<SnackbarNotification>) => void;
  removeSnackbar: (id: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAllNotifications: () => void;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsByType: (type: string) => Notification[];
  requestDesktopPermission: () => Promise<void>;
}

export interface NotificationProviderProps {
  children: ReactNode;
}

export interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
}
