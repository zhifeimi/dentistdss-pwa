import React from 'react';
import { Box, Button } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router';
import { NAVIGATION_ITEMS } from './constants';

export const Navigation: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <Box component="nav" aria-label="Main" sx={{ display: 'flex', gap: 0.5 }}>
      {NAVIGATION_ITEMS.map((item) => {
        // A section stays highlighted on its sub-pages (/learn/<guide>, /for-clinics/<feature>).
        const current = item.path === pathname;
        const active = current || pathname.startsWith(`${item.path}/`);
        return (
          <Button
            key={item.path}
            component={RouterLink}
            to={item.path}
            aria-current={current ? 'page' : active ? 'true' : undefined}
            sx={{
              color: active ? 'text.primary' : 'text.secondary',
              fontWeight: active ? 650 : 550,
              px: 1.5,
              '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};
