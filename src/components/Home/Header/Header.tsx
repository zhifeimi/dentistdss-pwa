import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import { NotificationBell } from '../../NotificationSystem';
import { Logo } from './Logo';
import { Navigation } from './Navigation';
import { UserActions } from './UserActions';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';
import { ProfileMenu } from './ProfileMenu';
import { useHeaderState } from './useHeaderState';
import { HEADER_STYLES } from './constants';
import type { HeaderProps } from './types';

/**
 * Refactored Header component
 * 
 * Simplified from 448 lines to ~100 lines by:
 * - Extracting components into focused modules
 * - Moving utility functions to separate files
 * - Using custom hooks for state management
 * - Separating constants and types
 * 
 * Benefits:
 * ✅ Single Responsibility Principle
 * ✅ Better testability
 * ✅ Improved maintainability
 * ✅ Reusable components
 */
const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode, currentUser }) => {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    scrolled,
    mobileMenuAnchorEl,
    profileMenuAnchor,
    handleMobileMenuOpen,
    handleMobileMenuClose,
    handleProfileMenuOpen,
    handleProfileMenuClose,
  } = useHeaderState();

  return (
    <AppBar
      position="fixed"
      elevation={darkMode ? 2 : (scrolled ? 4 : 0)}
      sx={{
        background: darkMode
          ? (scrolled ? HEADER_STYLES.darkModeBackground : 'transparent')
          : (scrolled ? 'rgba(255, 255, 255, 0.85)' : 'transparent'),
        backdropFilter: !darkMode && scrolled ? 'blur(12px)' : undefined,
        borderBottom: scrolled ? undefined : 'none',
        color: darkMode ? undefined : theme.palette.text.primary,
        transition: 'background 0.5s ease, padding 0.3s ease, min-height 0.3s ease',
        width: '100%',
        zIndex: theme.zIndex.drawer + 1,
        minHeight: { xs: 56, sm: scrolled ? 56 : 64, md: scrolled ? 56 : 64 },
        paddingTop: { xs: theme.spacing(0.5), sm: scrolled ? theme.spacing(0.5) : theme.spacing(1) },
        paddingBottom: { xs: theme.spacing(0.5), sm: scrolled ? theme.spacing(0.5) : theme.spacing(1) },
      }}
    >
      <Toolbar
        sx={{
          flexWrap: 'wrap',
          minHeight: scrolled && !isMobile ? '56px !important' : (isMobile ? '56px !important' : '64px !important'),
          paddingLeft: isMobile ? theme.spacing(1) : theme.spacing(2),
          paddingRight: isMobile ? theme.spacing(1) : theme.spacing(2),
          transition: 'min-height 0.3s ease, padding 0.3s ease',
        }}
      >
        {/* Logo */}
        <Logo darkMode={darkMode} scrolled={scrolled} />

        {/* Desktop Navigation */}
        {!isMobile && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Navigation isAuthenticated={isAuthenticated} />
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          
          {currentUser && <NotificationBell />}

          {!isMobile ? (
            <UserActions isAuthenticated={isAuthenticated} currentUser={currentUser} />
          ) : (
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuOpen}
              size="small"
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>

        {/* Mobile Menu */}
        <MobileMenu
          anchorEl={mobileMenuAnchorEl}
          isOpen={Boolean(mobileMenuAnchorEl)}
          onClose={handleMobileMenuClose}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
        />

        {/* Profile Menu */}
        <ProfileMenu
          anchorEl={profileMenuAnchor}
          isOpen={Boolean(profileMenuAnchor)}
          onClose={handleProfileMenuClose}
          onOpen={handleProfileMenuOpen}
          currentUser={currentUser}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
