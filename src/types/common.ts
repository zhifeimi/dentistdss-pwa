/**
 * Common types used throughout the dental clinic assistant application
 */

// Base entity interface
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Country interface for dictionary
export interface Country {
  code: string;
  name: string;
}

// Theme mode
export type ThemeMode = 'light' | 'dark';

// Urgency levels used by the appointment API
export type UrgencyLevel =
  | 'ROUTINE'
  | 'MODERATE'
  | 'URGENT'
  | 'EMERGENCY';

// Appointment status used by the appointment API
export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

// User roles - matching backend format (uppercase)
export type UserRole =
  | 'PATIENT'
  | 'DENTIST'
  | 'CLINIC_ADMIN'
  | 'RECEPTIONIST'
  | 'SYSTEM_ADMIN';
