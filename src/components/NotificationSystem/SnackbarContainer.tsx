import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNotifications } from './NotificationContext';

/**
 * Snackbar Container Component
 * Renders all active snackbar notifications
 */
export const SnackbarContainer: React.FC = () => {
  const { snackbars, removeSnackbar } = useNotifications();

  return (
    <>
      {snackbars.map((snackbar, index) => (
        <Snackbar
          key={snackbar.id}
          open
          autoHideDuration={snackbar.autoHideDuration}
          onClose={() => removeSnackbar(snackbar.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            bottom: { xs: 90 + (index * 70), sm: 24 + (index * 70) },
            zIndex: 1400 + index,
          }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => removeSnackbar(snackbar.id)}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};
