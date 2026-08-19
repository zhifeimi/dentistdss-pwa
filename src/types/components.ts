/**
 * Component prop interfaces and UI-related types
 */

import { ReactNode } from 'react';
import { UserRole } from './common';
import {
  Appointment,
  Clinic,
  TimeSlot,
  CreateAppointmentRequest,
  CreatePatientRequest,
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

// App Shell props
export interface AppShellProps {
  children: ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
}

// Dashboard Layout props
export interface DashboardLayoutProps {
  children: ReactNode;
  roles?: UserRole[];
}

// Header props
export interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
  onMenuClick: () => void;
  userMenuAnchorEl: HTMLElement | null;
  onUserMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onUserMenuClose: () => void;
}

// Sidebar props
export interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  sections: DashboardSection[];
  currentSection: DashboardSection | null;
}

// Appointment booking wizard props
export interface BookingWizardProps {
  open: boolean;
  onClose: () => void;
  currentStep: number;
  bookingData: Partial<CreateAppointmentRequest>;
  patientData: Partial<CreatePatientRequest>;
  errors: Record<string, string>;
  clinics: Clinic[];
  availableSlots: TimeSlot[];
  serviceTypes: any[];
  loading: boolean;
  onUpdateBookingData: (data: Partial<CreateAppointmentRequest>) => void;
  onUpdatePatientData: (data: Partial<CreatePatientRequest>) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onSubmitBooking: () => Promise<void>;
  onBookingComplete: () => void;
  userRole: UserRole;
  isLoggedIn?: boolean;
}

// Appointment calendar props
export interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  onSelectSlot: (slotInfo: any) => void;
  loading?: boolean;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
}

// Appointment card props
export interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onConfirm?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  showActions?: boolean;
  compact?: boolean;
}

// Message panel props
export interface MessagePanelProps {
  messages: any[];
  loading: boolean;
  onRefresh: () => void;
  onMessageClick: (messageId: number) => void;
  unreadCount?: number;
}

// Notification system props
export interface NotificationSystemProps {
  children: ReactNode;
}

export interface NotificationContextValue {
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  hideNotification: () => void;
}

// Form validation props
export interface FormValidationProps<T> {
  data: T;
  rules: ValidationRules<T>;
  onValidate?: (errors: Record<keyof T, string>) => void;
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

// Confirmation dialog props
export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error' | 'info';
}

// Global snackbar props
export interface GlobalSnackbarProps {
  message?: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  open?: boolean;
  autoHideDuration?: number;
  onClose?: () => void;
}

// Error boundary props
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

// Password strength indicator props
export interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  minLength?: number;
}

// Enhanced data grid types
export interface DataGridColumn {
  field: string;
  headerName: string;
  type?: 'string' | 'number' | 'date' | 'datetime' | 'currency' | 'chip' | 'avatar';
  sortable?: boolean;
  renderCell?: (params: { row: any; value: any }) => ReactNode;
  getColor?: (value: any) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export interface EnhancedDataGridProps<T = any> {
  data?: T[];
  columns?: DataGridColumn[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onAdd?: () => void;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  density?: 'compact' | 'standard' | 'comfortable';
  pageSize?: number;
}

// Clinic search props
export interface ClinicSearchProps {
  onClinicSelect: (clinic: Clinic) => void;
  selectedLocation?: { lat: number; lng: number };
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  filters?: {
    services?: string[];
    radius?: number;
    availability?: string;
  };
  onFiltersChange?: (filters: any) => void;
}

// System Settings component props
export interface SystemSettingsSectionProps {}

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
