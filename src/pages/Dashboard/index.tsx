import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/auth';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';

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
  const { currentUser } = useAuth();

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
