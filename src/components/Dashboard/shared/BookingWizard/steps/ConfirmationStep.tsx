import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Person as PatientIcon,
  LocationOn as ClinicIcon,
  Schedule as TimeIcon,
  Assignment as ServiceIcon,
} from '@mui/icons-material';
import type { Clinic as ApiClinic } from '../../../../../types/api';

interface BookingData {
  clinicId: string;
  serviceType: string;
  date: string;
  startTime: string;
  endTime: string;
  urgency: string;
  reason?: string;
  symptoms?: string;
  notes?: string;
}

interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Use the API Clinic type
type Clinic = ApiClinic;

interface ServiceType {
  id: string;
  name: string;
  duration: number;
}

interface ConfirmationStepProps {
  bookingData: BookingData;
  patientData: PatientData;
  clinics: Clinic[];
  serviceTypes: ServiceType[];
  isLoggedIn?: boolean;
}

/**
 * ConfirmationStep - Final step showing appointment summary
 */
const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  bookingData,
  patientData,
  clinics,
  serviceTypes,
  isLoggedIn,
}) => {
  const selectedClinic = clinics.find(c => String(c.id) === bookingData.clinicId);
  const selectedService = serviceTypes.find(s => s.id === bookingData.serviceType);

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Confirm Your Appointment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review your appointment details before confirming.
      </Typography>

      <Grid container spacing={3}>
        {/* Appointment Details */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Appointment Details</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatDate(bookingData.date)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="text.secondary">Time</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Clinic Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ClinicIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Clinic</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {selectedClinic?.name || 'Unknown Clinic'}
              </Typography>
              {selectedClinic?.address && (
                <Typography variant="body2" color="text.secondary">
                  {selectedClinic.address}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Service Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ServiceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Service</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {selectedService?.name || 'Unknown Service'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip
                  label={`${selectedService?.duration || 0} minutes`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={bookingData.urgency}
                  size="small"
                  color={
                    bookingData.urgency === 'high' ? 'error' :
                    bookingData.urgency === 'medium' ? 'warning' : 'success'
                  }
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Information */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PatientIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Patient Information</Typography>
              </Box>
              
              {isLoggedIn ? (
                <Typography variant="body1">
                  Appointment will be booked for your account.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {patientData.firstName} {patientData.lastName}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {patientData.email}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {patientData.phone}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Reason and Notes */}
        {(bookingData.reason || bookingData.symptoms || bookingData.notes) && (
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Additional Information</Typography>
                
                {bookingData.reason && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Reason for Visit</Typography>
                    <Typography variant="body1">{bookingData.reason}</Typography>
                  </Box>
                )}
                
                {bookingData.symptoms && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Symptoms</Typography>
                    <Typography variant="body1">{bookingData.symptoms}</Typography>
                  </Box>
                )}
                
                {bookingData.notes && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Additional Notes</Typography>
                    <Typography variant="body1">{bookingData.notes}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ConfirmationStep;
