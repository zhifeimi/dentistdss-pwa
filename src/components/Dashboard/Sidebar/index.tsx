import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { getDisplayName, getInitials } from '../../../utils/dashboard/dashboardUtils';
import { roleMeta } from '../../../utils/dashboard/roleConfig';
import { User, UserRole, DashboardSection } from '../../../types';

// Constants for accessibility
const TOUCH_TARGETS = {
  MINIMUM: 44, // Minimum touch target size for accessibility
};

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
  logout: () => void;
}

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
  logout,
}) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const avatarSrc = currentUser?.avatarUrl || currentUser?.photoURL || currentUser?.profilePicture || '';

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper
      }}>
        {/* User Profile Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          gap: { xs: 1.5, sm: 2 }
        }}>
          <Avatar
            src={avatarSrc}
            sx={{ 
              width: { xs: 40, sm: 48 }, 
              height: { xs: 40, sm: 48 },
              bgcolor: 'primary.main',
              fontSize: { xs: '1rem', sm: '1.2rem' }
            }}
          >
            {getInitials(currentUser)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant={isSmallMobile ? "body2" : "subtitle1"} 
              sx={{ 
                fontWeight: 'medium',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {getDisplayName(currentUser)}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentUser?.email}
            </Typography>
          </Box>
        </Box>

        {/* Clinic Info */}
        {currentUser?.clinicName && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2,
            p: 1.5,
            backgroundColor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
            borderRadius: 1
          }}>
            <LocalHospitalIcon sx={{ 
              fontSize: { xs: '1rem', sm: '1.1rem' }, 
              color: 'primary.main' 
            }} />
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'medium',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}
            >
              {currentUser.clinicName}
            </Typography>
          </Box>
        )}

        {/* Role Selector */}
        {rolesWithComponents.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary', 
              fontWeight: 'medium',
              mb: 1,
              display: 'block'
            }}>
              Switch Role
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {rolesWithComponents.map((roleWithComponent) => (
                <Chip
                  key={roleWithComponent.key}
                  label={roleMeta[roleWithComponent.key]?.label}
                  size="small"
                  variant={activeRoleKey === roleWithComponent.key ? 'filled' : 'outlined'}
                  color={activeRoleKey === roleWithComponent.key ? 'primary' : 'default'}
                  onClick={() => setActiveRoleKey(roleWithComponent.key)}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 24, sm: 28 },
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: activeRoleKey === roleWithComponent.key 
                        ? 'primary.dark' 
                        : theme.palette.mode === 'light' ? 'grey.100' : 'grey.800'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <Typography variant="overline" sx={{
          px: 2,
          mb: 1,
          display: 'block',
          color: 'text.secondary',
          fontWeight: 'bold'
        }}>{activeRoleKey ? roleMeta[activeRoleKey]?.label : 'Dashboard'}</Typography>
        <List component="nav" sx={{ px: 1 }}>
          {activeRoleSections.map((section) => (
            <ListItem key={section.id} disablePadding>
              <ListItemButton
                selected={section.id === activeSectionKey}
                onClick={() => {
                  setActiveSectionKey(section.id);
                  if (!isSmUp) handleDrawerToggle(); // Close mobile drawer on selection
                }}
                sx={{
                  borderRadius: 1,
                  py: { xs: 1.5, sm: 1 },
                  minHeight: TOUCH_TARGETS.MINIMUM,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
                    '&:hover': { backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.24)' }
                  },
                  '&:hover': { backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)' },
                  my: 0.5
                }}
              >
                <ListItemIcon sx={{
                  color: section.id === activeSectionKey ? 'primary.main' : 'text.secondary',
                  minWidth: { xs: '32px', sm: '36px' }
                }}>{section.icon}</ListItemIcon>
                <ListItemText
                  primary={section.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: section.id === activeSectionKey ? 'medium' : 'regular',
                        fontSize: { xs: '0.85rem', sm: '0.9rem' }
                      }
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="dashboard navigation">
      <Drawer
        variant={isSmUp ? 'permanent' : 'temporary'}
        open={isSmUp ? true : mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better for SEO and accessibility
          sx: {
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }
          }
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create(['background-color'], {
              duration: theme.transitions.duration.standard,
            }),
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
