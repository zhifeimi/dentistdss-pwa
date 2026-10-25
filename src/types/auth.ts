/**
 * Authentication and user-related type definitions
 */

import { BaseEntity, UserRole } from './common';

// User interface
export interface User extends BaseEntity {
  uid?: string; // Firebase UID compatibility
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[]; // User roles are stored as an array/list
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  profilePicture?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  clinicId?: number;
  clinicName?: string;
  // Additional avatar properties for compatibility
  avatarUrl?: string;
  photoURL?: string;
}

// Signup data
export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  clinicName?: string;
  existingClinicId?: number;
}

// Auth response from login/signup
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

// Auth context value
export interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    role?: UserRole, 
    clinicName?: string, 
    existingClinicId?: number
  ) => Promise<any>;
  logout: () => Promise<void>;
  googleIdLogin: (credential: string, nonce: string) => Promise<User>;
  processAuthToken: (token: string, tokenType?: string) => Promise<User>;
}

// Profile update data
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  profilePicture?: string;
}

// Clinic staff signup data
export interface ClinicStaffSignupData extends SignupData {
  clinicId: number;
  position?: string;
  licenseNumber?: string;
}

// Clinic admin signup data
export interface ClinicAdminSignupData extends SignupData {
  clinicName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  businessEmail: string;
  website?: string;
}
