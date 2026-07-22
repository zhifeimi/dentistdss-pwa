import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Alert,
  Snackbar,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/auth';
import api from '../services';
import type { Appointment, ClinicService as Service, Dentist, TimeSlot } from '../types/api';
// import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
// import { TimePicker } from '@mui/x-date-pickers/TimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface AppointmentBookingProps {
  open: boolean;
  onClose: () => void;
  onBookingComplete?: (appointment: Appointment) => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ open, onClose, onBookingComplete }) => {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<number | string>('');
  const [selectedService, setSelectedService] = useState<number | string>('');
  const [patientNotes, setPatientNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({open: false, message: '', severity: 'info'});

  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const steps = ['Select Service', 'Choose Dentist', 'Pick Date & Time', 'Confirm Details'];

  // Fetch services and dentists on component mount
  useEffect(() => {
    const fetchInitialData = async (): Promise<void> => {
      setLoading(true);
      try {
        // Fetch services
        const fetchedServices = await api.clinic.getServices();
        setServices(fetchedServices || []); // API returns array directly

        // Fetch dentists
        const fetchedDentists = await api.clinic.getDentists(currentUser?.clinicId); // Pass clinicId if required
        setDentists(fetchedDentists || []); // API returns array directly

      } catch (err: any) {
        console.error('Failed to fetch initial data:', err);
        setSnackbar({
          open: true,
          message: 'Failed to load services or dentists. Please try again.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.clinicId) {
      fetchInitialData();
    }
  }, [currentUser?.clinicId]);

  // Fetch available slots when selectedDate, selectedDentist, or selectedService changes
  useEffect(() => {
    const fetchAvailableSlots = async (): Promise<void> => {
      if (!selectedDentist || !selectedService || !selectedDate || !currentUser?.clinicId) {
        setAvailableSlots([]);
        return;
      }

      setLoading(true);
      try {
        const serviceDuration = services.find(s => s.id === selectedService)?.duration ||
                               services.find(s => s.id === selectedService)?.durationMinutes;
        if (!serviceDuration) {
          console.warn('Service duration not found for selected service.');
          setAvailableSlots([]);
          setLoading(false);
          return;
        }

        const dateString = selectedDate.toISOString().split('T')[0];
        const slots = await api.appointment.getAvailableSlots(
          Number(selectedDentist), // Convert to number
          currentUser?.clinicId || 0,
          dateString,
          Number(selectedService),
          serviceDuration,
        );
        setAvailableSlots(slots || []); // API returns TimeSlot array
      } catch (err: any) {
        console.error('Failed to fetch available slots:', err);
        setSnackbar({
          open: true,
          message: 'Failed to load available slots. Please try again.',
          severity: 'error'
        });
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, selectedDentist, selectedService, services, currentUser?.clinicId]);

  const handleNext = (): void => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleBookAppointment();
    }
  };

  const handleBack = (): void => {
    setActiveStep(activeStep - 1);
  };

  const handleBookAppointment = async (): Promise<void> => {
    setLoading(true);
    try {
      if (!currentUser?.id || !currentUser.roles?.includes('PATIENT')) {
        throw new Error('A signed-in patient account is required to book an appointment');
      }

      const appointmentData = {
        patientId: currentUser?.id,
        dentistId: Number(selectedDentist),
        clinicId: currentUser?.clinicId || 0,
        serviceId: Number(selectedService),
        appointmentDate: selectedDate.toISOString().split('T')[0],
        startTime: selectedTime || '',
        endTime: '', // This will need to be calculated based on start time and service duration
        reasonForVisit: patientNotes,
        symptoms: '',
        urgencyLevel: 'ROUTINE' as const,
        notes: patientNotes,
      };

      // Calculate endTime
      const serviceObj = services.find(s => s.id === selectedService);
      if (serviceObj && selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startTimeDate = new Date(selectedDate);
        startTimeDate.setHours(hours, minutes, 0, 0);

        const duration = serviceObj.duration || serviceObj.durationMinutes || 30;
        const endTimeDate = new Date(startTimeDate.getTime() + duration * 60 * 1000);
        appointmentData.endTime = endTimeDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

      const newAppointment = await api.appointment.createAppointment(appointmentData);

      setSnackbar({
        open: true,
        message: 'Appointment booked successfully! You will receive a confirmation email shortly.',
        severity: 'success'
      });

      if (onBookingComplete) {
        onBookingComplete(newAppointment);
      }

      // Reset form
      setActiveStep(0);
      setSelectedService('');
      setSelectedDentist('');
      setSelectedTime(null);
      setPatientNotes('');

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Failed to book appointment:', error);
      setSnackbar({
        open: true,
        message: `Failed to book appointment: ${error.message || 'Please try again.'} `,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (): boolean => {
    switch (activeStep) {
      case 0:
        return selectedService !== '';
      case 1:
        return selectedDentist !== '';
      case 2:
        return selectedTime !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = (): React.ReactElement | null => {
    switch (activeStep) {
      case 0:
        return (
            <Box>
              <Typography variant="h6" gutterBottom>Select a Service</Typography>
              {loading && activeStep === 0 ? (
                <CircularProgress />
              ) : services.length === 0 ? (
                <Alert severity="info">No services available. Please check back later.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {services.map((service) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={service.id}>
                        <Card
                            sx={{
                              cursor: 'pointer',
                              border: selectedService === service.id ? 2 : 1,
                              borderColor: selectedService === service.id ? 'primary.main' : 'divider',
                            }}
                            onClick={() => setSelectedService(service.id)}
                        >
                          <CardContent>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                              <MedicalServicesIcon sx={{mr: 1}}/>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {service.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Duration: {service.duration || service.durationMinutes} minutes
                            </Typography>
                            <Typography variant="h6" color="primary">
                              ${service.price}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                  ))}
                </Grid>
              )}
            </Box>
        );

      case 1:
        return (
            <Box>
              <Typography variant="h6" gutterBottom>Choose Your Dentist</Typography>
              {loading && activeStep === 1 ? (
                <CircularProgress />
              ) : dentists.length === 0 ? (
                <Alert severity="info">No dentists available. Please check back later.</Alert>
              ) : (
                <RadioGroup
                    value={selectedDentist}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedDentist(e.target.value)}
                >
                  {dentists.map((dentist) => {
                    const isAvailable = dentist.available ?? dentist.isAvailable;
                    const dentistName = dentist.name || `${dentist.firstName} ${dentist.lastName}`;
                    const specialty = dentist.specialty || dentist.specializations?.[0] || 'General Dentistry';

                    return (
                      <Card key={dentist.id} sx={{mb: 2, opacity: isAvailable ? 1 : 0.6}}>
                        <CardContent>
                          <FormControlLabel
                              value={dentist.id}
                              control={<Radio/>}
                              disabled={!isAvailable}
                              label={
                                <Box sx={{ml: 1}}>
                                  <Box sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                                    <PersonIcon sx={{mr: 1}}/>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                      {dentistName}
                                    </Typography>
                                    {!isAvailable && (
                                        <Chip label="Unavailable" size="small" color="error" sx={{ml: 1}}/>
                                    )}
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {specialty}
                                  </Typography>
                                </Box>
                              }
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </RadioGroup>
              )}
            </Box>
        );

      case 2:
        return (
            <Box>
              <Typography variant="h6" gutterBottom>Select Date & Time</Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Available Dates</Typography>
                  {/* Placeholder for DateCalendar - will be enabled when MUI X is installed */}
                  <Card sx={{p: 2, textAlign: 'center'}}>
                    <EventIcon sx={{fontSize: 48, color: 'text.secondary', mb: 1}}/>
                    <Typography variant="body2" color="text.secondary">
                      Calendar component will be available after installing @mui/x-date-pickers
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Available Times</Typography>
                  {loading && activeStep === 2 ? (
                    <CircularProgress />
                  ) : availableSlots.length === 0 ? (
                    <Alert severity="info">No available slots for the selected dentist and service on this date.</Alert>
                  ) : (
                    <Grid container spacing={1}>
                      {availableSlots.map((slot, index) => {
                        const timeString = typeof slot === 'string' ? slot : slot.startTime;
                        return (
                          <Grid size={{ xs: 6, sm: 4 }} key={index}>
                            <Button
                                variant={selectedTime === timeString ? 'contained' : 'outlined'}
                                fullWidth
                                size="small"
                                onClick={() => setSelectedTime(timeString)}
                                startIcon={<ScheduleIcon/>}
                            >
                              {timeString}
                            </Button>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Box>
        );

      case 3: {
        const selectedServiceObj = services.find(s => s.id === selectedService);
        const selectedDentistObj = dentists.find(d => d.id === selectedDentist);
        const dentistName = selectedDentistObj?.name ||
                           (selectedDentistObj ? `${selectedDentistObj.firstName} ${selectedDentistObj.lastName}` : '');

        return (
            <Box>
              <Typography variant="h6" gutterBottom>Confirm Your Appointment</Typography>
              <List>
                <ListItem><Typography variant="subtitle1">Service:</Typography> <Typography>{selectedServiceObj?.name}</Typography></ListItem>
                <ListItem><Typography variant="subtitle1">Dentist:</Typography> <Typography>{dentistName}</Typography></ListItem>
                <ListItem><Typography variant="subtitle1">Date:</Typography> <Typography>{selectedDate.toLocaleDateString()}</Typography></ListItem>
                <ListItem><Typography variant="subtitle1">Time:</Typography> <Typography>{selectedTime}</Typography></ListItem>
                <ListItem><Typography variant="subtitle1">Notes:</Typography> <Typography>{patientNotes || 'N/A'}</Typography></ListItem>
              </List>
              <FormControl fullWidth margin="normal">
                <TextField
                    label="Additional Notes (Optional)"
                    multiline
                    rows={3}
                    value={patientNotes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientNotes(e.target.value)}
                    variant="outlined"
                />
              </FormControl>
            </Box>
        );
      }

      default:
        return null;
    }
  };

  return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Book New Appointment</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} alternativeLabel sx={{mb: 3}}>
            {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
            ))}
          </Stepper>
          {renderStepContent()}
        </DialogContent>
        <DialogActions sx={{p: 2}}>
          <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              variant="outlined"
          >
            Back
          </Button>
          <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || !isStepValid()}
          >
            {activeStep === steps.length - 1 ? 'Book Appointment' : 'Next'}
          </Button>
        </DialogActions>

        <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({...snackbar, open: false})}
            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        >
          <Alert onClose={() => setSnackbar({...snackbar, open: false})} severity={snackbar.severity} sx={{width: '100%'}}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Dialog>
  );
};

export default AppointmentBooking;
