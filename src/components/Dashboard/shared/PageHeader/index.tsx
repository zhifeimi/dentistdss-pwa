import React from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Buttons on the right; they wrap under the title on narrow screens. */
  actions?: React.ReactNode;
}

/**
 * PageHeader — the h1 of a dashboard page. The app bar already names the
 * section, so the title says what the page is for in a few plain words.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 2,
      mb: 3,
    }}
  >
    <Box sx={{ minWidth: 0, maxWidth: 720 }}>
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {description}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{actions}</Box>}
  </Box>
);

export default PageHeader;
