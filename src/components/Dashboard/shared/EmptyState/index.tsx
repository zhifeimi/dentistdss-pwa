import React from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  title: string;
  /** What fills this space, or what to do to fill it. */
  children?: React.ReactNode;
}

/** EmptyState — a quiet panel for a list with nothing in it yet. */
const EmptyState: React.FC<EmptyStateProps> = ({ title, children }) => (
  <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
    <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 650 }}>
      {title}
    </Typography>
    {children && (
      <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
        {children}
      </Typography>
    )}
  </Box>
);

export default EmptyState;
