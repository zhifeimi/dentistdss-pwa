import React from 'react';
import { Box } from '@mui/material';
import ClinicSelectionStep from './steps/ClinicSelectionStep';
import DateTimeSelectionStep from './steps/DateTimeSelectionStep';
import ServiceDetailsStep from './steps/ServiceDetailsStep';
import PatientInfoStep from './steps/PatientInfoStep';
import ConfirmationStep from './steps/ConfirmationStep';
import { adjustStepIndex } from './utils';
import type { WizardContentProps } from './types';

/**
 * WizardContent component
 * Renders the appropriate step content
 */
export const WizardContent: React.FC<WizardContentProps> = ({
  currentStep,
  bookingData,
  patientData,
  errors,
  clinics,
  dentists,
  availableSlots,
  serviceTypes,
  loading,
  isLoggedIn,
  onUpdateBookingData,
  onUpdatePatientData,
}) => {
  const getStepContent = (step: number): React.ReactNode => {
    const adjustedStep = adjustStepIndex(step, isLoggedIn);
    
    switch (adjustedStep) {
      case 0:
        return (
          <ClinicSelectionStep
            clinics={clinics}
            selectedClinic={bookingData.clinicId}
            onSelectClinic={(clinicId) => onUpdateBookingData('clinicId', clinicId)}
            error={errors.clinicId}
            loading={loading}
          />
        );
      case 1:
        return (
          <DateTimeSelectionStep
            selectedClinic={bookingData.clinicId}
            selectedDate={bookingData.date}
            selectedTime={bookingData.startTime}
            selectedDentist={bookingData.dentistId}
            dentists={dentists}
            availableSlots={availableSlots}
            onSelectDate={(date) => onUpdateBookingData('date', date)}
            onSelectTime={(startTime, endTime) => {
              onUpdateBookingData('startTime', startTime);
              onUpdateBookingData('endTime', endTime);
            }}
            onSelectDentist={(dentistId) => onUpdateBookingData('dentistId', dentistId)}
            errors={errors}
            loading={loading}
          />
        );
      case 2:
        return (
          <ServiceDetailsStep
            serviceTypes={serviceTypes}
            selectedService={bookingData.serviceType}
            reason={bookingData.reason}
            symptoms={bookingData.symptoms}
            urgency={bookingData.urgency}
            notes={bookingData.notes}
            onSelectService={(serviceType) => onUpdateBookingData('serviceType', serviceType)}
            onUpdateReason={(reason) => onUpdateBookingData('reason', reason)}
            onUpdateSymptoms={(symptoms) => onUpdateBookingData('symptoms', symptoms)}
            onUpdateUrgency={(urgency) => onUpdateBookingData('urgency', urgency)}
            onUpdateNotes={(notes) => onUpdateBookingData('notes', notes)}
            errors={errors}
          />
        );
      case 3:
        return (
          <PatientInfoStep
            patientData={patientData}
            onUpdatePatientData={onUpdatePatientData}
            errors={errors}
          />
        );
      case 4:
        return (
          <ConfirmationStep
            bookingData={bookingData}
            patientData={patientData}
            clinics={clinics}
            serviceTypes={serviceTypes}
            isLoggedIn={isLoggedIn}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        px: 3,
        pb: 3,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {getStepContent(currentStep)}
    </Box>
  );
};
