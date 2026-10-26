import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

// Molar on a scrubs-green tile. Shared with public/favicon.svg — keep the
// path in sync if the mark changes.
export const MOLAR_PATH =
  'M9 11.6C9 8 11.4 6.6 13.6 7.3c1.6.5 3.2.5 4.8 0C20.6 6.6 23 8 23 11.6c0 2.6-.9 4.6-1.4 7l-.9 4.9c-.3 1.4-2.1 1.5-2.5.2l-1.3-4.3c-.3-.9-1.6-.9-1.9 0l-1.3 4.3c-.4 1.3-2.2 1.2-2.5-.2l-.9-4.9C9.9 16.2 9 14.2 9 11.6Z';

interface BrandMarkProps {
  size?: number;
  /** `inverse` puts a white tile on dark brand surfaces. */
  tone?: 'default' | 'inverse';
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 32, tone = 'default' }) => {
  const theme = useTheme();
  const tile = tone === 'inverse' ? '#FFFFFF' : theme.palette.primary.main;
  const molar = tone === 'inverse' ? '#0B5D52' : theme.palette.primary.contrastText;
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
    >
      <rect width="32" height="32" rx="8" fill={tile} />
      <path d={MOLAR_PATH} fill={molar} />
    </Box>
  );
};

interface WordmarkProps {
  size?: number;
}

/** Mark plus product name, as used in the site header and sidebar. */
export const Wordmark: React.FC<WordmarkProps> = ({ size = 32 }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25 }}>
    <BrandMark size={size} />
    <Typography
      component="span"
      sx={{
        fontWeight: 750,
        fontSize: size * 0.56,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: 'text.primary',
      }}
    >
      DentistDSS
    </Typography>
  </Box>
);
