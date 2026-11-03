import { useLayoutEffect, useMemo } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useAuth } from './context/auth';
import useDarkMode from './hooks/useDarkMode';
import './styles/App.scss';
import GlobalSnackbar from './components/GlobalSnackbar';
import AppShell from './components/AppShell';
import { NotificationProvider } from './components/NotificationSystem';
import theme from './context/theme';
import { trackPageView } from './analytics';

import AppRoutes from './routes';

interface AppContentProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  logout: () => void;
}

/**
 * Everything inside the router. The browser wraps it in BrowserRouter (App
 * below); the build-time prerender wraps it in StaticRouter
 * (src/entry-server.tsx), so both render the same tree.
 */
export function AppContent({ darkMode, toggleDarkMode, logout }: AppContentProps): React.JSX.Element {
  const appTheme = useMemo(() => theme(darkMode ? 'dark' : 'light'), [darkMode]);
  const { pathname } = useLocation();
  // Update the SDK path before descendant mount effects record conversions.
  useLayoutEffect(() => trackPageView(pathname), [pathname]);

  // No global auth-loading gate here: public routes must paint immediately while
  // the background auth restore runs. Protected routes handle `loading` locally
  // (see routes/index.tsx and pages/Dashboard/index.tsx).
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <NotificationProvider>
        <AppShell
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          logout={logout}
        >
          <AppRoutes />
        </AppShell>
        <GlobalSnackbar />
      </NotificationProvider>
    </ThemeProvider>
  );
}

function App(): React.JSX.Element {
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <Router>
      <AppContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} logout={logout} />
    </Router>
  );
}

export default App;
