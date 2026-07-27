import React from 'react';
import { Alert, Box, useMediaQuery, useTheme } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from '@/context/auth';
import { DashboardProvider } from '@/context/dashboard/DashboardContext';
import { useDashboardNavigation } from '@/hooks/dashboard/useDashboardNavigation';
import DashboardErrorBoundary from '../../ErrorBoundary/DashboardErrorBoundary';
import Header from '../Header';
import Sidebar from '../Sidebar';
import PageContainer from '../PageContainer';
import ChangePasswordPage from '../../../pages/DashboardPages/ChangePasswordPage';
import UserProfilePage from '../../../pages/DashboardPages/UserProfilePage';
import { UserRole } from '../../../types';

const drawerWidth = 240;

interface DashboardLayoutInternalProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
  logout: () => void;
}

/**
 * Internal Dashboard Layout Component
 * Uses dashboard context and hooks for state management
 */
const DashboardLayoutInternal: React.FC<DashboardLayoutInternalProps> = ({
  darkMode,
  toggleDarkMode,
  logout,
}) => {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const { currentUser } = useAuth();

  // Use dashboard navigation hook
  const {
    activeRoleKey,
    activeRoleSections,
    currentSection,
    roleRoutes,
    rolesWithComponents,
    mobileOpen,
    userMenuAnchorEl,
    activeSectionLabel,
    hasMultipleRoles,
    handleRoleChange,
    handleSectionChange,
    handleDrawerToggle,
    handleUserMenuOpen,
    handleUserMenuClose,
  } = useDashboardNavigation();

  // Show loading or error states
  if (!currentUser) {
    return <Alert severity='warning'>Please log in to access the dashboard.</Alert>;
  }

  if (rolesWithComponents.length === 0) {
    return <Alert severity='info'>No dashboard roles available for your account.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header */}
      <Header
        isSmUp={isSmUp}
        handleDrawerToggle={handleDrawerToggle}
        activeSectionLabel={activeSectionLabel}
        userMenuAnchorEl={userMenuAnchorEl}
        handleUserMenuOpen={handleUserMenuOpen}
        handleUserMenuClose={handleUserMenuClose}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        logout={logout}
        hasMultipleRoles={hasMultipleRoles}
      />

      {/* Sidebar */}
      <Sidebar
        isSmUp={isSmUp}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        drawerWidth={drawerWidth}
        currentUser={currentUser}
        activeRoleKey={activeRoleKey}
        rolesWithComponents={rolesWithComponents}
        setActiveRoleKey={handleRoleChange}
        activeRoleSections={activeRoleSections}
        activeSectionKey={currentSection?.id || ''}
        setActiveSectionKey={handleSectionChange}
        logout={logout}
      />

      {/* Main Content with Routes */}
      <PageContainer drawerWidth={drawerWidth}>
        <Routes>
          {/* Standalone routes accessible from any role */}
          <Route
            path='/profile'
            element={<UserProfilePage />}
          />
          <Route
            path='/change-password'
            element={<ChangePasswordPage />}
          />

          {/* Generate routes for role-specific sections */}
          {roleRoutes.map((route) => (
            <Route
              key={route.key}
              path={route.path}
              element={
                <route.component
                  clinicId={currentUser?.clinicId}
                  userRole={activeRoleKey as UserRole}
                />
              }
            />
          ))}

          {/* Default redirect */}
          <Route
            path='/dashboard'
            element={
              <Navigate
                to='/overview'
                replace
              />
            }
          />

          {/* 404 for invalid routes */}
          <Route
            path='*'
            element={
              <Alert severity='error'>
                Page not found. Please select a valid section from the sidebar.
              </Alert>
            }
          />
        </Routes>
      </PageContainer>
    </Box>
  );
};

interface DashboardLayoutProps extends DashboardLayoutInternalProps {
  children?: React.ReactNode;
  roles?: UserRole[];
}

/**
 * Main Dashboard Layout Component with Context Provider
 * Wraps the internal component with necessary providers
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  roles = [],
  ...props
}) => {
  return (
    <DashboardErrorBoundary>
      <DashboardProvider roles={roles}>
        <DashboardLayoutInternal {...props} />
      </DashboardProvider>
    </DashboardErrorBoundary>
  );
};

export default DashboardLayout;
