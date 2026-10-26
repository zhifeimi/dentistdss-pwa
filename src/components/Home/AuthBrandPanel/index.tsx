import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { CheckRounded } from '@mui/icons-material';
import { BrandMark } from '../../shared/BrandMark';

const POINTS = [
  'Search clinics near you and book a time online',
  'Ask Dentabot about a symptom at any hour',
  'Your records stay between you and your clinic',
];

/**
 * AuthBrandPanel — the deep-green side panel of the login and patient
 * sign-up pages (hidden below md). Same inverted band as "For clinics".
 */
const AuthBrandPanel: React.FC = () => {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box
      sx={{
        height: '100%',
        p: 5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 6,
        bgcolor: isDark ? '#0F2B26' : '#073B34',
        color: '#ECF5F2',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <BrandMark size={28} tone="inverse" />
        <Typography component="span" sx={{ fontWeight: 750, fontSize: '1.0625rem', letterSpacing: '-0.02em' }}>
          DentistDSS
        </Typography>
      </Box>
      <Box>
        <Typography variant="h4" component="p" sx={{ color: 'inherit', maxWidth: '16ch' }}>
          Dental care without the phone queue
        </Typography>
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 3, display: 'grid', gap: 1.5 }}>
          {POINTS.map((point) => (
            <Box component="li" key={point} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
              <CheckRounded sx={{ fontSize: 20, mt: '2px', color: '#6FCDB8' }} />
              <Typography sx={{ color: '#C9DDD7' }}>{point}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: '#A9C9C0' }}>
        Patients and clinic staff log in here.
      </Typography>
    </Box>
  );
};

export default AuthBrandPanel;
