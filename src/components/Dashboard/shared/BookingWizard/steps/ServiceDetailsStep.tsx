import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

interface ServiceType {
  id: string;
  name: string;
  description?: string;
  duration?: number;
}

interface ServiceDetailsStepProps {
  serviceTypes: ServiceType[];
  selectedService: string;
  reason: string;
  symptoms: string;
  urgency: string;
  notes: string;
  onSelectService: (serviceId: string) => void;
  onUpdateReason: (reason: string) => void;
  onUpdateSymptoms: (symptoms: string) => void;
  onUpdateUrgency: (urgency: string) => void;
  onUpdateNotes: (notes: string) => void;
  errors: { [key: string]: string };
}

/**
 * ServiceDetailsStep - Third step for service details
 */
const ServiceDetailsStep: React.FC<ServiceDetailsStepProps> = ({
  serviceTypes,
  selectedService,
  reason,
  symptoms,
  urgency,
  notes,
  onSelectService,
  onUpdateReason,
  onUpdateSymptoms,
  onUpdateUrgency,
  onUpdateNotes,
  errors,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Service Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide details about your appointment.
      </Typography>

      <Grid container spacing={3}>
        {/* Service Type */}
        <Grid size={{ xs: 12, md: 3}}>
          <FormControl fullWidth error={!!errors.serviceType}>
            <InputLabel>Service Type</InputLabel>
            <Select
              value={selectedService}
              label="Service Type"
              onChange={(e) => onSelectService(e.target.value)}
            >
              {serviceTypes.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  {service.name} ({service.duration} min)
                </MenuItem>
              ))}
            </Select>
            {errors.serviceType && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.serviceType}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Urgency */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Urgency</InputLabel>
            <Select
              value={urgency}
              label="Urgency"
              onChange={(e) => onUpdateUrgency(e.target.value)}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Reason */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Reason for Visit"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => onUpdateReason(e.target.value)}
            error={!!errors.reason}
            helperText={errors.reason || 'Please describe the reason for your appointment'}
            required
          />
        </Grid>

        {/* Symptoms */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Symptoms (Optional)"
            multiline
            rows={3}
            value={symptoms}
            onChange={(e) => onUpdateSymptoms(e.target.value)}
            helperText="Describe any symptoms you're experiencing"
          />
        </Grid>

        {/* Additional Notes */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Additional Notes (Optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            helperText="Any additional information you'd like to share"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceDetailsStep;
