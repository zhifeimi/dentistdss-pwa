import React, { useEffect, useRef } from 'react';
import { Navigate, NavigationType, useLocation, useNavigationType } from 'react-router';
import { useAuth } from '../../context/auth';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import RouteFallback from '../../components/RouteFallback';
import { hasLoggedOut } from '../../utils/returnPath';

interface DashboardProps {
  children?: React.ReactNode;
  logout: () => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  children,
  logout,
  darkMode,
  toggleDarkMode
}) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const navigationType = useNavigationType();
  // Logging out drops currentUser while this page is still showing, and Back or
  // Forward after a logout reopens the previous person's pages. Both go to a
  // plain /login so whoever logs in next starts on their own overview; a visitor
  // who asked for this page (a booking link, say) keeps it.
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (currentUser) wasSignedIn.current = true;
  }, [currentUser]);

  // Auth restore runs in the background (App no longer gates globally). While
  // it is unresolved, show a protected-content skeleton instead of prematurely
  // redirecting a user whose refresh cookie has not been validated yet.
  if (loading) {
    return <RouteFallback />;
  }

  if (!currentUser) {
    const forget = wasSignedIn.current || (hasLoggedOut() && navigationType === NavigationType.Pop);
    return <Navigate to="/login" replace state={forget ? undefined : { from: location }} />;
  }

  // Dashboard component loaded successfully

  return (
    <DashboardLayout
      roles={currentUser.roles}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
      logout={logout}
    >
      {children}
    </DashboardLayout>
  );
};

export default Dashboard;
