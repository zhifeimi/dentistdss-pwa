import React from 'react';
import { Box, Container, Grid, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import config from '../../config';
import { Wordmark } from '../shared/BrandMark';

const GROUPS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Patients',
    links: [
      { label: 'Find a clinic', to: '/find-a-clinic' },
      { label: 'Learn', to: '/learn' },
      { label: 'Quiz', to: '/quiz' },
      { label: 'Reading list', to: '/book' },
    ],
  },
  {
    title: 'Clinics',
    links: [
      { label: 'Register your clinic', to: '/signup/clinic-admin' },
      { label: "Join your clinic's team", to: '/signup/clinic-staff' },
      { label: 'Log in', to: '/login' },
    ],
  },
];

// No global scroll restoration: footer links start the next page at the top.
const scrollToTop = () => window.scrollTo(0, 0);

const linkSx = {
  color: 'text.secondary',
  fontWeight: 500,
  '&:hover': { color: 'text.primary' },
} as const;

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', mt: 'auto' }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Wordmark size={28} />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', maxWidth: '38ch' }}>
              Online booking, patient records and an AI assistant for dental clinics and the people
              they look after.
            </Typography>
          </Grid>
          {GROUPS.map(({ title, links }) => (
            <Grid key={title} size={{ xs: 6, md: 2 }} component="nav" aria-label={title}>
              <Typography variant="subtitle2" component="h2" sx={{ mb: 1.5 }}>
                {title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1 }}>
                {links.map(({ label, to }) => (
                  <li key={to}>
                    <Link component={RouterLink} to={to} onClick={scrollToTop} variant="body2" sx={linkSx}>
                      {label}
                    </Link>
                  </li>
                ))}
              </Box>
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" component="h2" sx={{ mb: 1.5 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'grid', gap: 1, justifyItems: 'start' }}>
              <Link href="mailto:dentistdss@gmail.com" variant="body2" sx={linkSx}>
                dentistdss@gmail.com
              </Link>
              <Link component={RouterLink} to="/privacy" onClick={scrollToTop} variant="body2" sx={linkSx}>
                Privacy Policy
              </Link>
              <Link component={RouterLink} to="/terms" onClick={scrollToTop} variant="body2" sx={linkSx}>
                Terms &amp; Conditions
              </Link>
            </Box>
          </Grid>
        </Grid>
        <Typography
          variant="body2"
          sx={{ mt: { xs: 5, md: 7 }, pt: 3, borderTop: 1, borderColor: 'divider', color: 'text.secondary' }}
        >
          © {new Date().getFullYear()} {config.app.name} by Zhifei Mi. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
