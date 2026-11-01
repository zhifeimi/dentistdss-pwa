import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router';
import { useAuth } from '../../context/auth';
import { Seo } from '../../seo/Seo';
import { NOT_FOUND_PAGE } from '../../seo/pages';

/**
 * NotFound — unknown public paths. Marked noindex, and Vercel serves these
 * paths with HTTP 404, so mistyped or stale URLs never index as the home page.
 */
const NotFound: React.FC = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Seo {...NOT_FOUND_PAGE} path={pathname} />
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        Error 404
      </Typography>
      <Typography variant="h2" component="h1" sx={{ mt: 1 }}>
        We can't find that page
      </Typography>
      <Typography sx={{ mt: 2, color: 'text.secondary', maxWidth: '52ch' }}>
        The link may be out of date, or the address may have a typo. Try one of these instead.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 4, flexWrap: 'wrap' }}>
        <Button component={RouterLink} to="/find-a-clinic" variant="contained">
          Find a clinic
        </Button>
        <Button component={RouterLink} to="/learn" variant="outlined">
          Read oral health guides
        </Button>
        <Button component={RouterLink} to={isAuthenticated ? '/dashboard' : '/'}>
          {isAuthenticated ? 'Go to your dashboard' : 'Go to the home page'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
