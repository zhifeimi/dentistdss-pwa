import React from 'react';
import { Box, useTheme } from '@mui/material';

/**
 * GradientMesh — layered violet/indigo radial gradients used as the hero /
 * brand-panel backdrop. Pure CSS, no image assets, both themes (denser and
 * dimmer in dark mode). The mesh fades out at the edges so section text
 * stays readable.
 */
const GradientMesh: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: isDark ? '#131316' : '#f7f7f8',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: isDark
            ? [
                'radial-gradient(45% 60% at 15% 10%, rgba(108, 71, 255, 0.35), transparent 70%)',
                'radial-gradient(40% 55% at 85% 15%, rgba(86, 54, 232, 0.28), transparent 70%)',
                'radial-gradient(50% 60% at 50% 95%, rgba(139, 107, 255, 0.22), transparent 70%)',
              ].join(', ')
            : [
                'radial-gradient(45% 60% at 15% 10%, rgba(108, 71, 255, 0.20), transparent 70%)',
                'radial-gradient(40% 55% at 85% 15%, rgba(86, 54, 232, 0.16), transparent 70%)',
                'radial-gradient(50% 60% at 50% 95%, rgba(139, 107, 255, 0.14), transparent 70%)',
              ].join(', '),
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
    </Box>
  );
};

export default GradientMesh;
