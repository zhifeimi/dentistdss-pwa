import React from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * RouteFallback — lightweight content placeholder shown while a lazily loaded
 * route chunk downloads. Deliberately not a centered full-page spinner: the
 * surrounding shell (header/footer or sidebar) stays mounted, so we only
 * reserve content space to avoid layout shift.
 */
const RouteFallback: React.FC = () => (
  <Box
    component="main"
    sx={{
      px: { xs: 2, sm: 3 },
      py: { xs: 3, sm: 4 },
      maxWidth: 1200,
      width: '100%',
      mx: 'auto',
    }}
  >
    <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="70%" height={24} sx={{ mb: 3 }} />
    <Skeleton variant="rounded" height={220} sx={{ mb: 3 }} />
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
      <Skeleton variant="rounded" height={140} sx={{ flex: 1 }} />
      <Skeleton variant="rounded" height={140} sx={{ flex: 1 }} />
      <Skeleton variant="rounded" height={140} sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
    </Box>
  </Box>
);

export default RouteFallback;
