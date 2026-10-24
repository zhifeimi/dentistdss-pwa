import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import config from '../../config';

const Footer: React.FC = () => {
  return (
      <Box
          component="footer"
          sx={{
            minHeight: { xs: 60, sm: 50 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 0 },
            bgcolor: 'background.paper',
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 'auto',
          }}
      >
        <Typography
            variant="body2"
            sx={{
              fontSize: 'inherit',
              color: 'text.secondary',
              textAlign: 'center',
              lineHeight: { xs: 1.4, sm: 1.5 },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }
            }}
        >
          © {new Date().getFullYear()} {config.app.name} by Zhifei Mi - All rights reserved.
          <br />
          <RouterLink to="/terms" onClick={() => window.scrollTo(0, 0)}>Privacy Policy</RouterLink>
          {' · '}
          Contact us at: <a href="mailto:dentistdss@gmail.com">dentistdss@gmail.com</a>
        </Typography>
      </Box>
  );
};

export default Footer;
