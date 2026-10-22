import React from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import { LocationOn as ClinicIcon } from '@mui/icons-material';

/**
 * ClinicSelectionStep - First step of booking wizard for clinic selection
 */
const ClinicSelectionStep = ({
  clinics,
  selectedClinic,
  onSelectClinic,
  error,
  loading,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!clinics || clinics.length === 0) {
    return (
      <Alert severity="warning">
        No clinics available. Please contact support.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Select a Clinic
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the dental clinic where you'd like to schedule your appointment.
      </Typography>

      <RadioGroup
        value={selectedClinic}
        onChange={(e) => onSelectClinic(e.target.value)}
      >
        {clinics.map((clinic) => (
          <Card
            key={clinic.id}
            sx={{
              mb: 2,
              cursor: 'pointer',
              border: selectedClinic === clinic.id ? 2 : 1,
              borderColor: selectedClinic === clinic.id ? 'primary.main' : 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 1,
              },
            }}
            onClick={() => onSelectClinic(clinic.id)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
              <FormControlLabel
                value={clinic.id}
                control={<Radio />}
                label=""
                sx={{ mr: 2 }}
              />
              <ClinicIcon color="primary" sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {clinic.name}
                </Typography>
                {clinic.address && (
                  <Typography variant="body2" color="text.secondary">
                    {clinic.address}
                  </Typography>
                )}
                {clinic.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {clinic.phone}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};



export default ClinicSelectionStep;
