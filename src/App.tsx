import { useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useAuth } from './context/auth';
import useDarkMode from './hooks/useDarkMode';
import './styles/App.scss';
import GlobalSnackbar from './components/GlobalSnackbar';
import AppShell from './components/AppShell';
import { NotificationProvider } from './components/NotificationSystem';
import theme from './context/theme';

import AppRoutes from './routes';

function App(): React.JSX.Element {
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const appTheme = useMemo(() => theme(darkMode ? 'dark' : 'light'), [darkMode]);

  // No global auth-loading gate here: public routes must paint immediately while
  // the background auth restore runs. Protected routes handle `loading` locally
  // (see routes/index.tsx and pages/Dashboard/index.tsx).
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <NotificationProvider>
        <Router>
          <AppShell
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            logout={logout}
          >
            <AppRoutes />
          </AppShell>
          <GlobalSnackbar />
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
