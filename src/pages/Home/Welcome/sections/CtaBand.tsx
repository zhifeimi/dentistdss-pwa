import React from 'react';
import { Box, Button, Container, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router';

/**
 * CtaBand — final call to action on a violet-tinted panel.
 */
const CtaBand: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
      <Box
        sx={{
          textAlign: 'center',
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 8 },
          borderRadius: 4,
          border: `1px solid ${isDark ? 'rgba(139, 107, 255, 0.30)' : 'rgba(108, 71, 255, 0.22)'}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(108, 71, 255, 0.16), rgba(139, 107, 255, 0.06))'
            : 'linear-gradient(135deg, rgba(108, 71, 255, 0.10), rgba(139, 107, 255, 0.04))',
        }}
      >
        <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Ready when your teeth are
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520, mx: 'auto', mb: 4, lineHeight: 1.7 }}>
          Create a free account to ask Dentabot, book clinics online, and keep
          every visit in one place.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            color="primary"
            size="large"
            fullWidth={isSmallMobile}
          >
            Start free
          </Button>
          <Button
            component={RouterLink}
            to="/chat"
            variant="outlined"
            color="primary"
            size="large"
            fullWidth={isSmallMobile}
          >
            Talk to Dentabot
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CtaBand;
