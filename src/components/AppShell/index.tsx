import React from 'react';
import {
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useLocation } from 'react-router';
import dictionary from '../../utils/dictionary';

import Home from '../../pages/Home';
import Dashboard from '../../pages/Dashboard';

interface AppShellProps {
  children?: React.ReactNode;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
  logout: () => void;
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  darkMode,
  toggleDarkMode,
  logout,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  // Show help FAB only on public pages
  const isPublicPage = dictionary.locations.public.includes(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {(isPublicPage) ? (
        <Home isMobile={isMobile} darkMode={darkMode || false} toggleDarkMode={toggleDarkMode || (() => {})}>
          {children}
        </Home>
      ) : (
        <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} logout={logout}>
          {children}
        </Dashboard>
      )}
    </Box>
  );
};

export default AppShell;
