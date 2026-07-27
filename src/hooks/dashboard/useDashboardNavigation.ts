import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useDashboardState, useDashboardDispatch, DASHBOARD_ACTIONS } from '../../context/dashboard/DashboardContext';
import { getRoleNavigationSections, getDefaultSection } from '../../utils/dashboard/roleConfig';
import { UserRole } from '../../types';

/**
 * Custom hook for dashboard navigation management
 * Provides navigation actions and state management for the dashboard
 */
export const useDashboardNavigation = () => {
  const state = useDashboardState();
  const dispatch = useDashboardDispatch();
  const navigate = useNavigate();

  // Handle role change
  const handleRoleChange = useCallback((roleKey: UserRole) => {
    dispatch({
      type: DASHBOARD_ACTIONS.SET_ACTIVE_ROLE,
      payload: { roleKey },
    });

    // Navigate to default section for the new role
    const defaultSection = getDefaultSection(roleKey);
    const sections = getRoleNavigationSections(roleKey);
    const defaultSectionObj = sections.find(s => s.id === defaultSection);
    if (defaultSectionObj) {
      navigate(defaultSectionObj.path);
    }
  }, [dispatch, navigate]);

  // Handle section change
  const handleSectionChange = useCallback((sectionKey: string) => {
    const section = state.activeRoleSections.find(s => s.id === sectionKey);
    if (section) {
      navigate(section.path);
    }
  }, [state.activeRoleSections, navigate]);

  // Handle mobile drawer toggle
  const handleDrawerToggle = useCallback(() => {
    dispatch({ type: DASHBOARD_ACTIONS.TOGGLE_MOBILE_DRAWER });
  }, [dispatch]);

  // Handle user menu
  const handleUserMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    dispatch({
      type: DASHBOARD_ACTIONS.SET_USER_MENU_ANCHOR,
      payload: event.currentTarget,
    });
  }, [dispatch]);

  const handleUserMenuClose = useCallback(() => {
    dispatch({
      type: DASHBOARD_ACTIONS.SET_USER_MENU_ANCHOR,
      payload: null,
    });
  }, [dispatch]);

  // Get active section label
  const getActiveSectionLabel = useCallback(() => {
    return state.currentSection?.label || 'Dashboard';
  }, [state.currentSection]);

  // Check if user has multiple roles
  const hasMultipleRoles = useCallback(() => {
    return state.rolesWithComponents.length > 1;
  }, [state.rolesWithComponents]);

  return {
    // State
    activeRoleKey: state.activeRoleKey,
    activeRoleSections: state.activeRoleSections,
    currentSection: state.currentSection,
    roleRoutes: state.roleRoutes,
    rolesWithComponents: state.rolesWithComponents,
    mobileOpen: state.mobileOpen,
    userMenuAnchorEl: state.userMenuAnchorEl,
    
    // Actions
    handleRoleChange,
    handleSectionChange,
    handleDrawerToggle,
    handleUserMenuOpen,
    handleUserMenuClose,
    
    // Computed values
    activeSectionLabel: getActiveSectionLabel(),
    hasMultipleRoles: hasMultipleRoles(),
  };
};
