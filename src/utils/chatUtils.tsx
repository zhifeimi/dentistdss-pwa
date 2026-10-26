import React from 'react';
import { Chip } from '@mui/material';
import { User, UserRole } from '../types';

/**
 * Utility functions for chat and dashboard components
 */

// Type definitions
type ChatType = 'receptionist' | 'triage' | 'aidentist' | 'documentationSummarize' | 'help';

interface QuickAction {
  label: string;
  onClick: () => void;
}

interface StatusConfig {
  color: 'success' | 'warning' | 'info' | 'default' | 'error';
  label: string;
}

/**
 * Generate welcome messages for different chat types and user roles
 */
export const getWelcomeMessage = (
  chatType: ChatType,
  userRole: UserRole,
  currentUser?: User | null,
): string => {
  const userName = currentUser?.firstName || 'there';
  const doctorName = currentUser?.lastName || 'Doctor';

  switch (chatType) {
    case 'receptionist':
      return `Hello ${userName}! I'm your AI receptionist. I can help you with appointment booking, clinic information, and general inquiries. How can I assist you today?`;

    case 'triage':
      return `Hello ${userName}! I'm your AI triage assistant. I can help assess your symptoms and determine the urgency of your dental concerns. Please describe your symptoms or concerns.`;

    case 'aidentist':
      return `Hello Dr. ${doctorName}! I'm your AI clinical assistant. I can help with patient assessments, treatment planning, clinical decision support, and dental guidelines. How can I assist you today?`;

    case 'documentationSummarize':
      return `Hello Dr. ${doctorName}! I'm your AI documentation assistant. I can help you summarize patient appointments, create clinical notes, and generate treatment summaries. Please provide the appointment details or clinical notes you'd like me to summarize.`;

    case 'help':
    default:
      return `Hello ${userName}! I'm your dental AI assistant. I can help you with appointment booking, dental health questions, and clinic information. How can I assist you today?`;
  }
};

/**
 * Get status chip component with consistent styling
 */
export const getStatusChip = (status: string): React.ReactElement => {
  const statusConfig: Record<string, StatusConfig> = {
    CONFIRMED: { color: 'success', label: 'Confirmed' },
    REQUESTED: { color: 'warning', label: 'Requested' },
    PENDING: { color: 'warning', label: 'Pending' },
    IN_PROGRESS: { color: 'info', label: 'In progress' },
    RESCHEDULED: { color: 'info', label: 'Rescheduled' },
    COMPLETED: { color: 'default', label: 'Completed' },
    CANCELLED: { color: 'error', label: 'Cancelled' },
    NO_SHOW: { color: 'error', label: 'No-show' },
  };
  const normalizedStatus = status.toUpperCase().replaceAll('-', '_');
  const config = statusConfig[normalizedStatus] || {
    color: 'default' as const,
    label: status,
  };
  return <Chip label={config.label} color={config.color} size='small' />;
};

/**
 * Quick action configurations for different chat types
 */
export const getQuickActions = (
  chatType: ChatType,
  setQuickInput: (input: string) => void,
): QuickAction[] => {
  const actions: Record<ChatType, QuickAction[]> = {
    receptionist: [
      {
        label: 'Book a visit',
        onClick: () => setQuickInput('I need to book an appointment'),
      },
      {
        label: 'Opening hours',
        onClick: () => setQuickInput('What are your clinic hours?'),
      },
      {
        label: 'Services',
        onClick: () => setQuickInput('What services do you offer?'),
      },
    ],

    triage: [
      {
        label: 'Tooth pain',
        onClick: () => setQuickInput('I have severe tooth pain'),
      },
      {
        label: 'Bleeding gums',
        onClick: () => setQuickInput('My gums are bleeding'),
      },
      {
        label: 'Emergency',
        onClick: () => setQuickInput('I have a dental emergency'),
      },
    ],

    aidentist: [
      {
        label: 'Tooth pain',
        onClick: () =>
          setQuickInput(
            'Patient presents with severe tooth pain in upper right molar. What are the differential diagnoses?',
          ),
      },
      {
        label: 'Treatment options',
        onClick: () =>
          setQuickInput(
            'What are the treatment options for a deep carious lesion approaching the pulp?',
          ),
      },
      {
        label: 'Emergency protocol',
        onClick: () =>
          setQuickInput('Patient has swelling and fever. What are the emergency protocols?'),
      },
      {
        label: 'Clinical guidelines',
        onClick: () =>
          setQuickInput(
            'What are the latest guidelines for antibiotic prophylaxis in dental procedures?',
          ),
      },
    ],

    documentationSummarize: [
      {
        label: 'Sample appointment',
        onClick: () =>
          setQuickInput(
            'Patient: John Doe, Age: 45\nChief Complaint: Tooth pain upper right\nClinical Findings: Deep caries #3, percussion positive\nTreatment: Root canal therapy initiated\nNext Appointment: Complete RCT in 1 week',
          ),
      },
      {
        label: 'Treatment summary',
        onClick: () =>
          setQuickInput(
            'Summarize the following treatment plan and create a patient-friendly explanation',
          ),
      },
      {
        label: 'Progress note',
        onClick: () =>
          setQuickInput('Create a progress note for the following clinical observations'),
      },
    ],

    help: [],
  };

  return actions[chatType] || [];
};
