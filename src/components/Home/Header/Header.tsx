import React from 'react';
import { AppBar, Box, IconButton, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../../../context/auth';
import { Wordmark } from '../../shared/BrandMark';
import ThemeToggleButton from '../../shared/ThemeToggleButton';
import { Navigation } from './Navigation';
import { UserActions } from './UserActions';
import { MobileMenu } from './MobileMenu';
import { useHeaderState } from './useHeaderState';
import type { HeaderProps } from './types';

/**
 * Public site header. Sits on the page background at the top of the page and
 * picks up a porcelain surface with a hairline once content scrolls under it.
 */
const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const { scrolled, mobileMenuAnchorEl, handleMobileMenuOpen, handleMobileMenuClose } =
    useHeaderState();

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: scrolled ? 'background.paper' : 'background.default',
        borderBottomColor: scrolled ? 'divider' : 'transparent',
        transition: theme.transitions.create(['background-color', 'border-color']),
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 60, md: 68 },
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          gap: 1,
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          aria-label="DentistDSS home"
          sx={{ display: 'inline-flex', textDecoration: 'none', borderRadius: 1, mr: { md: 3 } }}
        >
          <Wordmark size={isCompact ? 28 : 32} />
        </Box>

        {!isCompact && <Navigation isAuthenticated={isAuthenticated} />}

        <Box sx={{ flexGrow: 1 }} />

        <ThemeToggleButton darkMode={darkMode} onToggle={toggleDarkMode} />

        {isCompact ? (
          <IconButton
            aria-label="Open menu"
            onClick={handleMobileMenuOpen}
            sx={{ color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <UserActions isAuthenticated={isAuthenticated} />
        )}

        <MobileMenu
          anchorEl={mobileMenuAnchorEl}
          isOpen={Boolean(mobileMenuAnchorEl)}
          onClose={handleMobileMenuClose}
          isAuthenticated={isAuthenticated}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
