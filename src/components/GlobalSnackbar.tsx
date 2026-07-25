import React, { useState, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useLocation } from 'react-router';
import type { AlertColor } from '@mui/material/Alert';

interface SnackbarEvent extends CustomEvent {
  detail: {
    message: string;
    severity?: AlertColor;
  };
}

const GlobalSnackbar: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [severity, setSeverity] = useState<AlertColor>('info'); // Default severity

  // Define pages where GlobalSnackbar should be suppressed
  const suppressedPages: string[] = [
    '/login',
    '/signup',
    '/signup/clinic-staff',
    '/signup/clinic-admin'
  ];

  // Check if current page should suppress GlobalSnackbar
  const shouldSuppressSnackbar = suppressedPages.includes(location.pathname);

  useEffect(() => {
    const handleShowSnackbar = (event: Event): void => {
      const snackbarEvent = event as SnackbarEvent;
      // Suppress GlobalSnackbar on Login and Signup pages since they have inline error handling
      if (shouldSuppressSnackbar) {
        return;
      }

      setMessage(snackbarEvent.detail.message);
      setSeverity(snackbarEvent.detail.severity || 'info');
      setOpen(true);
    };

    window.addEventListener('show-snackbar', handleShowSnackbar);

    return () => {
      window.removeEventListener('show-snackbar', handleShowSnackbar);
    };
  }, [shouldSuppressSnackbar]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
      <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{vertical: 'top', horizontal: 'center'}}
      >
        <Alert onClose={handleClose} severity={severity} sx={{width: '100%'}}>
          {typeof message === 'object' ? JSON.stringify(message) : message}
        </Alert>
      </Snackbar>
  );
};

export default GlobalSnackbar;