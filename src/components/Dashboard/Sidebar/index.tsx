import React from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Avatar,
  Box,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Wordmark } from '../../shared/BrandMark';
import { getDisplayName, getInitials } from '../../../utils/dashboard/dashboardUtils';
import { roleMeta } from '../../../utils/dashboard/roleConfig';
import { User, UserRole, DashboardSection } from '../../../types';

interface SidebarProps {
  isSmUp: boolean;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  drawerWidth: number;
  currentUser?: User;
  activeRoleKey?: string | null;
  rolesWithComponents: Array<{
    key: UserRole;
    navigationSections: DashboardSection[];
  }>;
  setActiveRoleKey: (role: UserRole) => void;
  activeRoleSections: DashboardSection[];
  activeSectionKey: string;
  setActiveSectionKey: (sectionKey: string) => void;
}

/**
 * Sidebar — brand, the clinic and role the user is working as, the role's
 * sections, and who is signed in. Permanent from `sm` up, a drawer below.
 */
const Sidebar: React.FC<SidebarProps> = ({
  isSmUp,
  mobileOpen,
  handleDrawerToggle,
  drawerWidth,
  currentUser,
  activeRoleKey,
  rolesWithComponents,
  setActiveRoleKey,
  activeRoleSections,
  activeSectionKey,
  setActiveSectionKey,
}) => {
  const avatarSrc = currentUser?.avatarUrl || currentUser?.photoURL || currentUser?.profilePicture || '';
  const roleLabel = activeRoleKey ? roleMeta[activeRoleKey as UserRole]?.label : undefined;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Same height as the header so the two hairlines meet */}
      <Box
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          aria-label="DentistDSS home"
          sx={{ display: 'inline-flex', textDecoration: 'none', borderRadius: 1 }}
        >
          <Wordmark size={28} />
        </Box>
      </Box>

      {/* Where and as whom the user is working */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        {currentUser?.clinicName && (
          <Typography variant="subtitle2" noWrap title={currentUser.clinicName}>
            {currentUser.clinicName}
          </Typography>
        )}
        {rolesWithComponents.length > 1 ? (
          <Box
            role="group"
            aria-label="Switch role"
            sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}
          >
            {rolesWithComponents.map(({ key }) => {
              const active = activeRoleKey === key;
              return (
                <Chip
                  key={key}
                  label={roleMeta[key]?.label}
                  size="small"
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  aria-pressed={active}
                  onClick={() => setActiveRoleKey(key)}
                />
              );
            })}
          </Box>
        ) : (
          roleLabel && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {roleLabel}
            </Typography>
          )
        )}
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 0.5 }}>
        {activeRoleSections.map((section) => {
          const selected = section.id === activeSectionKey;
          return (
            <ListItem key={section.id} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={selected}
                aria-current={selected ? 'page' : undefined}
                onClick={() => {
                  setActiveSectionKey(section.id);
                  if (!isSmUp) handleDrawerToggle();
                }}
                sx={{ minHeight: 44, px: 1.5 }}
              >
                <ListItemIcon sx={{ color: 'text.secondary', '& svg': { fontSize: 20 } }}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  slotProps={{
                    primary: { variant: 'body2', sx: { fontWeight: selected ? 650 : 500 } },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Signed-in user */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Avatar
          src={avatarSrc}
          sx={(theme) => ({
            width: 36,
            height: 36,
            fontSize: '0.875rem',
            fontWeight: 650,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main',
          })}
        >
          {getInitials(currentUser)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {getDisplayName(currentUser)}
          </Typography>
          <Typography variant="caption" noWrap component="p" sx={{ color: 'text.secondary' }}>
            {currentUser?.email}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="dashboard navigation">
      <Drawer
        variant={isSmUp ? 'permanent' : 'temporary'}
        open={isSmUp ? true : mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
