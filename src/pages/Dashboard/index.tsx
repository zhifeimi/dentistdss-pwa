import React from 'react';
import { Navigate } from 'react-router';
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

  // Auth restore runs in the background (App no longer gates globally). While
  // it is unresolved, show a protected-content skeleton instead of prematurely
  // redirecting a user whose refresh cookie has not been validated yet.
  if (loading) {
    return <RouteFallback />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
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
