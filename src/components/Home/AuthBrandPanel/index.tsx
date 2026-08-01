import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Chat as ChatIcon,
  CalendarMonth as CalendarIcon,
  Lock as LockIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import GradientMesh from '../../../pages/Home/Welcome/sections/GradientMesh';

const BULLETS = [
  { icon: ChatIcon, text: 'Dentabot answers dental questions 24/7' },
  { icon: CalendarIcon, text: 'Book trusted clinics online in minutes' },
  { icon: LockIcon, text: 'Your records, private by design' },
];

/**
 * AuthBrandPanel — the right-hand brand panel of the login/signup pages
 * (hidden below md): gradient mesh, wordmark, three product bullets.
 */
const AuthBrandPanel: React.FC = () => (
  <GradientMesh>
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
        p: 5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <HospitalIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          DentistDSS
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: 360 }}>
        Your dental clinic, intelligently assisted — answers, booking, and
        records in one place.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {BULLETS.map(({ icon: Icon, text }) => (
          <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 0.75,
                borderRadius: 2,
                color: 'primary.main',
                bgcolor: 'rgba(108, 71, 255, 0.10)',
              }}
            >
              <Icon fontSize="small" />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
              {text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  </GradientMesh>
);

export default AuthBrandPanel;
