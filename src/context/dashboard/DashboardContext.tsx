import React, { createContext, useContext, useReducer, useEffect, ReactNode, Dispatch } from 'react';
import { useNavigate, useLocation } from 'react-router';
// import { useAuth } from '../auth'; // Not used currently
import { DashboardState, DashboardSection, UserRole } from '../../types';
import {
  getRoleNavigationSections,
  getDefaultSection,
  getRoleRoutes,
  roleMeta
} from '../../utils/dashboard/roleConfig';

// Dashboard state shape
const initialState: DashboardState = {
  // Navigation state
  activeRoleKey: null,
  activeRoleSections: [],
  currentSection: null,
  roleRoutes: [],
  rolesWithComponents: [],

  // UI state
  mobileOpen: false,
  userMenuAnchorEl: null,

  // Loading and error states
  isLoading: false,
  error: null,
};

// Action types
const DASHBOARD_ACTIONS = {
  SET_ACTIVE_ROLE: 'SET_ACTIVE_ROLE',
  SET_ROLES_WITH_COMPONENTS: 'SET_ROLES_WITH_COMPONENTS',
  SET_CURRENT_SECTION: 'SET_CURRENT_SECTION',
  TOGGLE_MOBILE_DRAWER: 'TOGGLE_MOBILE_DRAWER',
  SET_USER_MENU_ANCHOR: 'SET_USER_MENU_ANCHOR',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
} as const;

type DashboardAction =
  | { type: 'SET_ACTIVE_ROLE'; payload: { roleKey: string } }
  | { type: 'SET_ROLES_WITH_COMPONENTS'; payload: any[] }
  | { type: 'SET_CURRENT_SECTION'; payload: DashboardSection | null }
  | { type: 'TOGGLE_MOBILE_DRAWER' }
  | { type: 'SET_USER_MENU_ANCHOR'; payload: HTMLElement | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Reducer function
const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case DASHBOARD_ACTIONS.SET_ACTIVE_ROLE: {
      const { roleKey } = action.payload;
      const activeRoleSections = getRoleNavigationSections(roleKey as UserRole);
      const roleRoutes = getRoleRoutes(roleKey as UserRole);
      
      return {
        ...state,
        activeRoleKey: roleKey,
        activeRoleSections,
        roleRoutes,
      };
    }
    
    case DASHBOARD_ACTIONS.SET_ROLES_WITH_COMPONENTS:
      return {
        ...state,
        rolesWithComponents: action.payload,
      };
    
    case DASHBOARD_ACTIONS.SET_CURRENT_SECTION:
      return {
        ...state,
        currentSection: action.payload,
      };
    
    case DASHBOARD_ACTIONS.TOGGLE_MOBILE_DRAWER:
      return {
        ...state,
        mobileOpen: !state.mobileOpen,
      };
    
    case DASHBOARD_ACTIONS.SET_USER_MENU_ANCHOR:
      return {
        ...state,
        userMenuAnchorEl: action.payload,
      };
    
    case DASHBOARD_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case DASHBOARD_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case DASHBOARD_ACTIONS.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
};

// Create contexts
const DashboardStateContext = createContext<DashboardState | undefined>(undefined);
const DashboardDispatchContext = createContext<Dispatch<DashboardAction> | undefined>(undefined);

/**
 * Dashboard Provider Component
 * Manages all dashboard-related state and provides it to child components
 */
interface DashboardProviderProps {
  children: ReactNode;
  roles?: UserRole[];
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children, roles = [] }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();
  // const { currentUser } = useAuth(); // Commented out as it's not used

  // Initialize roles with components
  useEffect(() => {
    if (roles.length > 0) {
      const rolesWithComponents = roles
        .filter(role => roleMeta[role])
        .map(role => ({
          key: role,
          navigationSections: getRoleNavigationSections(role),
        }));
      
      dispatch({
        type: DASHBOARD_ACTIONS.SET_ROLES_WITH_COMPONENTS,
        payload: rolesWithComponents,
      });

      // Set default active role
      if (rolesWithComponents.length > 0 && !state.activeRoleKey) {
        const defaultRole = rolesWithComponents[0].key;
        dispatch({
          type: DASHBOARD_ACTIONS.SET_ACTIVE_ROLE,
          payload: { roleKey: defaultRole },
        });

        // Navigate to default section if at root
        if (location.pathname === '/') {
          const defaultSection = getDefaultSection(defaultRole as UserRole);
          const sections = getRoleNavigationSections(defaultRole as UserRole);
          const defaultSectionObj = sections.find(s => s.id === defaultSection);
          if (defaultSectionObj) {
            navigate(defaultSectionObj.path, { replace: true });
          }
        }
      }
    }
  }, [roles, location.pathname, navigate, state.activeRoleKey]);

  // Update current section based on location
  useEffect(() => {
    if (state.activeRoleSections.length > 0) {
      const currentSection = state.activeRoleSections.find(section =>
        location.pathname === section.path
      );
      dispatch({
        type: DASHBOARD_ACTIONS.SET_CURRENT_SECTION,
        payload: currentSection || null,
      });
    }
  }, [location.pathname, state.activeRoleSections]);

  return (
    <DashboardStateContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardStateContext.Provider>
  );
};

// Custom hooks for accessing context
export const useDashboardState = (): DashboardState => {
  const context = useContext(DashboardStateContext);
  if (context === undefined) {
    throw new Error('useDashboardState must be used within a DashboardProvider');
  }
  return context;
};

export const useDashboardDispatch = (): Dispatch<DashboardAction> => {
  const context = useContext(DashboardDispatchContext);
  if (context === undefined) {
    throw new Error('useDashboardDispatch must be used within a DashboardProvider');
  }
  return context;
};

// Export action types for use in components
export { DASHBOARD_ACTIONS };
