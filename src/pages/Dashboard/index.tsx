import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/auth';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import RouteFallback from '../../components/RouteFallback';

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
  // Logging out drops currentUser while this page is still showing. That
  // person goes to a plain /login so whoever logs in next starts on their own
  // overview; a visitor who was never signed in here keeps the page they asked for.
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
    return <Navigate to="/login" replace state={wasSignedIn.current ? undefined : { from: location }} />;
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
