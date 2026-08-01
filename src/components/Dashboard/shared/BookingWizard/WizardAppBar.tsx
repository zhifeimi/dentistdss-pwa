import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getNextButtonText } from './utils';
import type { WizardAppBarProps } from './types';

/**
 * WizardAppBar — booking wizard top bar in the site's header idiom:
 * hairline-bordered paper bar with a violet primary action, instead of a
 * solid colored band.
 */
export const WizardAppBar: React.FC<WizardAppBarProps> = ({
  onClose,
  onPreviousStep,
  onNext,
  isFirstStep,
  isLastStep,
  loading,
}) => {
  const theme = useTheme();

  return (
    <AppBar
      elevation={0}
      color="default"
      sx={{
        position: 'relative',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onClose}
          aria-label="close"
          sx={{ mr: 2, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flex: 1, fontWeight: 600 }}>
          Book New Appointment
        </Typography>

        {!isFirstStep && (
          <Button
            color="inherit"
            onClick={onPreviousStep}
            disabled={loading}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 1, color: 'text.secondary' }}
          >
            Go Back
          </Button>
        )}

        <Button
          color="primary"
          variant="contained"
          onClick={onNext}
          disabled={loading}
        >
          {getNextButtonText(isLastStep, loading)}
        </Button>
      </Toolbar>
    </AppBar>
  );
};
