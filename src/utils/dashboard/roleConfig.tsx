import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MessageIcon from '@mui/icons-material/Message';
import EventIcon from '@mui/icons-material/Event';
import NotesIcon from '@mui/icons-material/Notes';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { UserRole, DashboardSection } from '../../types';
// Page components are lazy: the registry shape (ids, labels, paths, icons) is
// unchanged, but each role's pages are only fetched when that route renders.
// Directory pages import their index.tsx directly to avoid barrel hazards.
const OverviewPage = React.lazy(() => import('../../pages/DashboardPages/OverviewPage/index.tsx'));
const AppointmentsPage = React.lazy(() => import('../../pages/DashboardPages/AppointmentsPage/index.tsx'));
const MessagesPage = React.lazy(() => import('../../pages/DashboardPages/MessagesPage/index.tsx'));
const SettingsPage = React.lazy(() => import('../../pages/DashboardPages/SettingsPage/index.tsx'));
const AIReceptionistPage = React.lazy(() => import('../../pages/DashboardPages/AIReceptionistPage/index.tsx'));
const AIDentistPage = React.lazy(() => import('../../pages/DashboardPages/AIDentistPage/index.tsx'));
const AISummarizePage = React.lazy(() => import('../../pages/DashboardPages/AISummarizePage/index.tsx'));
const UserManagementPage = React.lazy(() => import('../../pages/DashboardPages/UserManagementPage/index.tsx'));
const ApprovalsPage = React.lazy(() => import('../../pages/DashboardPages/ApprovalsPage/index.tsx'));
const DentalRecordsPage = React.lazy(() => import('../../pages/DashboardPages/DentalRecordsPage/index.tsx'));
const PatientRecordsPage = React.lazy(() => import('../../pages/DashboardPages/PatientRecordsPage/index.tsx'));
const ProfilePage = React.lazy(() => import('../../pages/DashboardPages/ProfilePage/index.tsx'));
const PatientsPage = React.lazy(() => import('../../pages/DashboardPages/PatientsPage/index.tsx'));
const CommunicationsPage = React.lazy(() => import('../../pages/DashboardPages/CommunicationsPage/index.tsx'));
const SchedulePage = React.lazy(() => import('../../pages/DashboardPages/Schedule/index.tsx'));
const HolidayManagementPage = React.lazy(() => import('../../pages/DashboardPages/HolidayManagementPage/index.tsx'));
const WorkingHoursPage = React.lazy(() => import('../../pages/DashboardPages/WorkingHoursPage/index.tsx'));


// Role metadata configuration
interface RoleMeta {
  label: string;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'warning' | 'info' | 'error' | 'default';
}

export const roleMeta: Record<UserRole, RoleMeta> = {
  PATIENT: {
    label: 'Patient',
    icon: <PersonIcon />,
    color: 'primary',
  },
  DENTIST: {
    label: 'Dentist',
    icon: <MedicalServicesIcon />,
    color: 'secondary',
  },
  CLINIC_ADMIN: {
    label: 'Clinic Admin',
    icon: <AdminPanelSettingsIcon />,
    color: 'warning',
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    icon: <SupportAgentIcon />,
    color: 'info',
  },
  SYSTEM_ADMIN: {
    label: 'System Admin',
    icon: <SettingsIcon />,
    color: 'error',
  },
};

// Navigation sections for each role with route paths and components
export const navigationSections: Record<UserRole, DashboardSection[]> = {
  PATIENT: [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DashboardIcon />,
      path: '/overview',
      component: OverviewPage
    },
    {
      id: 'appointments',
      label: 'My Appointments',
      icon: <EventIcon />,
      path: '/appointments',
      component: AppointmentsPage
    },
    {
      id: 'dental-records',
      label: 'Dental Records',
      icon: <HealthAndSafetyIcon />,
      path: '/dental-records',
      component: DentalRecordsPage
    },
    {
      id: 'ai-receptionist',
      label: 'AI Receptionist',
      icon: <SmartToyIcon />,
      path: '/ai-receptionist',
      component: AIReceptionistPage
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageIcon />,
      path: '/messages',
      component: MessagesPage
    },
  ],

  DENTIST: [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DashboardIcon />,
      path: '/overview',
      component: OverviewPage
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <EventIcon />,
      path: '/appointments',
      component: AppointmentsPage
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <ScheduleIcon />,
      path: '/schedule',
      component: SchedulePage
    },
    {
      id: 'patient-records',
      label: 'Patient Records',
      icon: <NotesIcon />,
      path: '/patient-records',
      component: PatientRecordsPage
    },
    {
      id: 'ai-dentist',
      label: 'AI Dentist',
      icon: <SmartToyIcon />,
      path: '/ai-dentist',
      component: AIDentistPage
    },
    {
      id: 'ai-summarize',
      label: 'AI Summarize',
      icon: <SummarizeIcon />,
      path: '/ai-summarize',
      component: AISummarizePage
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <PersonIcon />,
      path: '/profile',
      component: ProfilePage
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageIcon />,
      path: '/messages',
      component: MessagesPage
    },
  ],

  CLINIC_ADMIN: [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DashboardIcon />,
      path: '/overview',
      component: OverviewPage
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: <PeopleIcon />,
      path: '/staff',
      component: UserManagementPage
    },
    {
      id: 'approvals',
      label: 'Pending Staff Approvals',
      icon: <PendingActionsIcon />,
      path: '/approvals',
      component: ApprovalsPage
    },
    {
      id: 'holidays',
      label: 'Holiday Management',
      icon: <CalendarTodayIcon />,
      path: '/holidays',
      component: HolidayManagementPage
    },
    {
      id: 'working-hours',
      label: 'Working Hours',
      icon: <ScheduleIcon />,
      path: '/working-hours',
      component: WorkingHoursPage
    },
    {
      id: 'settings',
      label: 'Clinic Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      component: SettingsPage
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageIcon />,
      path: '/messages',
      component: MessagesPage
    },
  ],

  RECEPTIONIST: [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DashboardIcon />,
      path: '/overview',
      component: OverviewPage
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <EventAvailableIcon />,
      path: '/appointments',
      component: AppointmentsPage
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: <PeopleAltIcon />,
      path: '/patients',
      component: PatientsPage
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: <MessageIcon />,
      path: '/communications',
      component: CommunicationsPage
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageIcon />,
      path: '/messages',
      component: MessagesPage
    },
  ],

  SYSTEM_ADMIN: [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DashboardIcon />,
      path: '/overview',
      component: OverviewPage
    },
    {
      id: 'approvals',
      label: 'Pending Approvals',
      icon: <PendingActionsIcon />,
      path: '/approvals',
      component: ApprovalsPage
    },
    {
      id: 'users',
      label: 'System Users',
      icon: <PeopleIcon />,
      path: '/users',
      component: UserManagementPage
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      component: SettingsPage
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageIcon />,
      path: '/messages',
      component: MessagesPage
    },
  ],
};

/**
 * Get navigation sections for a specific role
 * @param role - Role key
 * @returns Navigation sections
 */
export const getRoleNavigationSections = (role: UserRole): DashboardSection[] => {
  return navigationSections[role] || [];
};

/**
 * Get role metadata
 * @param role - Role key
 * @returns Role metadata
 */
export const getRoleMeta = (role: UserRole): RoleMeta => {
  return roleMeta[role] || { label: role, icon: <PersonIcon />, color: 'default' };
};

/**
 * Get all available roles
 * @returns Array of role keys
 */
export const getAllRoles = (): UserRole[] => {
  return Object.keys(roleMeta) as UserRole[];
};

/**
 * Check if role exists
 * @param role - Role key
 * @returns Role exists
 */
export const isValidRole = (role: string): role is UserRole => {
  return Object.keys(roleMeta).includes(role as UserRole);
};

/**
 * Get default section for a role
 * @param role - Role key
 * @returns Default section key
 */
export const getDefaultSection = (role: UserRole): string | null => {
  const sections = getRoleNavigationSections(role);
  return sections.length > 0 ? sections[0].id : null;
};

/**
 * Find section by key in role's navigation
 * @param role - Role key
 * @param sectionKey - Section key
 * @returns Section object or null
 */
export const findSection = (role: UserRole, sectionKey: string): DashboardSection | null => {
  const sections = getRoleNavigationSections(role);
  return sections.find(section => section.id === sectionKey) || null;
};

/**
 * Get all unique routes for all roles
 * @returns Array of route objects
 */
export const getAllRoutes = (): any[] => {
  const routeMap = new Map();

  Object.values(navigationSections).forEach(sections => {
    sections.forEach(section => {
      if (!routeMap.has(section.path)) {
        routeMap.set(section.path, {
          path: section.path,
          component: section.component,
          key: section.id
        });
      }
    });
  });

  return Array.from(routeMap.values());
};

/**
 * Get routes for a specific role
 * @param role - Role key
 * @returns Array of route objects for the role
 */
export const getRoleRoutes = (role: UserRole): any[] => {
  const sections = getRoleNavigationSections(role);
  return sections.map(section => ({
    path: section.path,
    component: section.component,
    key: section.id
  }));
};

/**
 * Check if user has access to a specific route
 * @param role - User role
 * @param path - Route path
 * @returns Has access
 */
export const hasRouteAccess = (role: UserRole, path: string): boolean => {
  const sections = getRoleNavigationSections(role);
  return sections.some(section => section.path === path);
};
