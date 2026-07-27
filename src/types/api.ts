/**
 * API-related type definitions for the dental clinic assistant system
 */

import { BaseEntity, AppointmentStatus, UrgencyLevel } from './common';
import { User } from './auth';

// Clinic types
export interface Clinic extends BaseEntity {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phoneNumber?: string; // Alternative field name for compatibility
  operatingHours?: OperatingHours[];
  services?: ClinicService[];
}

export interface OperatingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isOpen: boolean;
}

// Holiday types
export type HolidayType =
  | 'NATIONAL_HOLIDAY'
  | 'CLINIC_CLOSURE'
  | 'STAFF_TRAINING'
  | 'MAINTENANCE'
  | 'EMERGENCY_CLOSURE'
  | 'VACATION'
  | 'OTHER';

export interface Holiday extends BaseEntity {
  clinicId: number;
  clinicName: string;
  name: string;
  holidayDate: string; // YYYY-MM-DD format
  description: string;
  type: HolidayType;
  typeDisplayName: string;
  isFullDayClosure: boolean;
  specialOpeningTime?: string; // HH:mm format
  specialClosingTime?: string; // HH:mm format
  isRecurring: boolean;
  emergencyContact?: string;
  displayInfo: string;
  hasSpecialHours: boolean;
  isUpcoming: boolean;
  daysUntilHoliday: number;
}

export interface CreateHolidayRequest {
  name: string;
  holidayDate: string; // YYYY-MM-DD format
  description: string;
  type: HolidayType;
  isFullDayClosure: boolean;
  specialOpeningTime?: string; // HH:mm format
  specialClosingTime?: string; // HH:mm format
  isRecurring: boolean;
  emergencyContact?: string;
}

// Working Hours types
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface WorkingHours extends BaseEntity {
  clinicId: number;
  clinicName: string;
  dayOfWeek: DayOfWeek;
  specificDate?: string; // YYYY-MM-DD format for specific date overrides
  openingTime: string; // HH:mm format
  closingTime: string; // HH:mm format
  breakStartTime?: string; // HH:mm format
  breakEndTime?: string; // HH:mm format
  isClosed: boolean;
  isEmergencyHours: boolean;
  notes?: string;
  scheduleType: string;
  displaySchedule: string;
  hasBreakTime: boolean;
}

export interface CreateWorkingHoursRequest {
  dayOfWeek: DayOfWeek;
  specificDate?: string; // YYYY-MM-DD format
  openingTime: string; // HH:mm format
  closingTime: string; // HH:mm format
  breakStartTime?: string; // HH:mm format
  breakEndTime?: string; // HH:mm format
  isClosed: boolean;
  isEmergencyHours: boolean;
  notes?: string;
}

export interface ClinicService extends BaseEntity {
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  isActive: boolean;

  // Compatibility properties
  duration?: number; // Alias for durationMinutes
}

// Dentist types
export interface Dentist extends User {
  licenseNumber: string;
  specializations?: string[];
  yearsOfExperience?: number;
  education?: string;
  clinicId: number;
  isAvailable: boolean;

  // Compatibility properties
  name?: string; // Computed from firstName + lastName
  specialty?: string; // Alias for first specialization
  available?: boolean; // Alias for isAvailable
}

// Patient types
export interface Patient extends User {
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

// Appointment types
export interface Appointment extends BaseEntity {
  patientId: number;
  dentistId: number;
  clinicId: number;
  serviceId: number;
  appointmentDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm:ss format
  endTime: string; // HH:mm:ss format
  status: AppointmentStatus;
  reasonForVisit?: string;
  symptoms?: string;
  urgencyLevel?: UrgencyLevel;
  notes?: string;
  createdBy?: number;
  confirmedBy?: number;
  cancelledBy?: number;
  cancellationReason?: string;

  // Populated fields
  patient?: Patient;
  dentist?: Dentist;
  clinic?: Clinic;
  service?: ClinicService;

  // Additional fields for compatibility
  patientName?: string;
  dentistName?: string;
  clinicName?: string;
  serviceName?: string;
  serviceType?: string;
  date?: string; // Alternative field name for appointmentDate
}

// Create appointment request (actor identity is derived from the JWT)
export interface CreateAppointmentRequest {
  patientId?: number;
  dentistId: number;
  clinicId: number;
  serviceId?: number;
  appointmentDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm:ss format
  endTime: string; // HH:mm:ss format
  reasonForVisit: string;
  symptoms?: string;
  urgencyLevel: UrgencyLevel;
  notes?: string;
}

export interface RescheduleAppointmentRequest {
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}

export interface CancelAppointmentRequest {
  reason: string;
}

// Available time slot
export interface TimeSlot {
  startTime: string; // HH:mm:ss format
  endTime: string; // HH:mm:ss format
  available: boolean;
  dentistId: number;
  clinicId: number;
  date: string; // YYYY-MM-DD format
}

// Message types
export interface Message extends BaseEntity {
  senderId: number;
  receiverId: number;
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: string;

  // Populated fields
  sender?: User | string; // Can be User object or computed string
  receiver?: User;

  // Compatibility properties
  date?: string; // Alias for createdAt
  read?: boolean; // Alias for isRead
}

export interface UnreadCountResponse {
  count: number;
}

// Notification types
export interface Notification extends BaseEntity {
  userId: number;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'system' | 'reminder';
  isRead: boolean;
  readAt?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

// Note: ChatMessage and ChatSession types are defined in common.ts to avoid duplication

// Clinic search and booking
export interface ClinicSearchParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  services?: string[];
  availability?: string; // date
}

export interface ClinicSearchResult extends Clinic {
  distance?: number;
  availableDentists?: Dentist[];
  nextAvailableSlot?: TimeSlot;
}

// Patient creation for booking
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD format
  address?: string;
  emergencyContact?: string;
}

// Clinic update request
export interface UpdateClinicRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  operatingHours?: OperatingHours[];
}

// Dentist availability
export interface DentistAvailability {
  id: string | number;
  dentistId: number;
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string;
  isActive: boolean;
  isRecurring: boolean;
  dayOfWeek: number;
  isBlocked?: boolean;
  blockReason?: string;
  availableSlots: TimeSlot[];
}

// System Settings types
export interface SystemSetting extends BaseEntity {
  key: string;
  value: string;
  description: string;
}

export interface SystemSettingData {
  key: string;
  value: string;
  description: string;
}

export interface SystemSettingValidationErrors {
  key?: string;
  value?: string;
  description?: string;
}
