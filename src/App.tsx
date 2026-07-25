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
  const { loading, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const appTheme = useMemo(() => theme(darkMode ? 'dark' : 'light'), [darkMode]);

  if (loading) {
    return <div>Loading...</div>;
  }

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
