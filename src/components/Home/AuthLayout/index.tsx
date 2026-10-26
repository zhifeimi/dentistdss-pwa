import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import AuthBrandPanel from '../AuthBrandPanel';

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Long forms drop the brand panel and use the full card width. */
  wide?: boolean;
  children: React.ReactNode;
}

/**
 * AuthLayout — the shared card of the login and sign-up pages: the form on
 * the left, the brand panel on the right from md up.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, wide = false, children }) => (
  <Container component="main" maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 6, md: 8 } }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: wide ? '1fr' : '1fr 1fr' },
        maxWidth: wide ? 760 : 1000,
        mx: 'auto',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: { xs: 3, sm: 5 } }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ mt: 3 }}>{children}</Box>
      </Box>
      {!wide && (
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <AuthBrandPanel />
        </Box>
      )}
    </Box>
  </Container>
);

export default AuthLayout;
