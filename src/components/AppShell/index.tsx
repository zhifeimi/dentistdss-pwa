import React, { Suspense } from 'react';
import {
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useLocation } from 'react-router';
import { isAppPath } from '../../utils/dictionary';

import Home from '../../pages/Home';
import RouteFallback from '../RouteFallback';

const Dashboard = React.lazy(() => import('../../pages/Dashboard/index.tsx'));

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

  // Signed-in app paths get the dashboard shell; everything else, including
  // unknown paths (which render the Not Found page), gets the public shell.
  const isPublicPage = !isAppPath(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {(isPublicPage) ? (
        <Home isMobile={isMobile} darkMode={darkMode || false} toggleDarkMode={toggleDarkMode || (() => {})}>
          {children}
        </Home>
      ) : (
        <Suspense fallback={<RouteFallback />}>
          <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} logout={logout}>
            {children}
          </Dashboard>
        </Suspense>
      )}
    </Box>
  );
};

export default AppShell;
