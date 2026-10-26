import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getNextButtonText } from './utils';
import type { WizardAppBarProps } from './types';

/**
 * WizardAppBar — booking wizard top bar in the site's header idiom: a
 * hairline-bordered paper bar with the step's primary action on the right.
 */
export const WizardAppBar: React.FC<WizardAppBarProps> = ({
  onClose,
  onPreviousStep,
  onNext,
  isFirstStep,
  isLastStep,
  loading,
}) => {
  return (
    <AppBar sx={{ position: 'relative' }}>
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onClose}
          aria-label="Close booking"
          sx={{ mr: 2, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
          Book a visit
        </Typography>

        {!isFirstStep && (
          <Button
            color="inherit"
            onClick={onPreviousStep}
            disabled={loading}
            sx={{ mr: 1, color: 'text.secondary' }}
          >
            Back
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
