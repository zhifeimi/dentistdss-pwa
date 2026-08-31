import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    Menu,
    MenuItem,
    Avatar,
    useTheme,
    useMediaQuery,
    Tooltip,
    Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MailIcon from '@mui/icons-material/Mail';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import { TOUCH_TARGETS } from '../../../utils/mobileOptimization';
import { useAuth } from '../../../context/auth';
import api from '../../../services';

interface HeaderProps {
    isSmUp: boolean;
    handleDrawerToggle: () => void;
    activeSectionLabel: string;
    userMenuAnchorEl: HTMLElement | null;
    handleUserMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
    handleUserMenuClose: () => void;
    darkMode?: boolean;
    toggleDarkMode?: () => void;
    logout: () => void;
    hasMultipleRoles: boolean;
}

const Header: React.FC<HeaderProps> = ({
    isSmUp,
    handleDrawerToggle,
    activeSectionLabel,
    userMenuAnchorEl,
    handleUserMenuOpen,
    handleUserMenuClose,
    darkMode,
    toggleDarkMode,
    logout,
    hasMultipleRoles,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Get current user and unread message count
    const { currentUser } = useAuth();
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const navigate = useNavigate();

    const userId = currentUser?.uid || currentUser?.id;

    // Fetch unread message count. The first fetch is deferred to browser idle
    // time so it doesn't compete with the dashboard's first content paint;
    // the 30-second poll starts after that first fetch.
    useEffect(() => {
        if (!userId) return;

        const fetchUnreadCount = async () => {
            try {
                const response = await api.message.getUnreadMessagesCount(Number(userId));
                // The API returns an object with counts, sum all values
                const totalCount = Object.values(response || {}).reduce((sum, count) => sum + (count || 0), 0);
                setUnreadCount(totalCount);
            } catch (error) {
                console.error('Failed to fetch unread message count:', error);
                setUnreadCount(0);
            }
        };

        let interval: ReturnType<typeof setInterval> | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const start = () => {
            void fetchUnreadCount();
            interval = setInterval(fetchUnreadCount, 30000);
        };
        const idleId = typeof requestIdleCallback === 'function'
            ? requestIdleCallback(start, { timeout: 2000 })
            : (timeout = setTimeout(start, 0), undefined);

        return () => {
            if (idleId !== undefined) cancelIdleCallback(idleId);
            if (timeout !== undefined) clearTimeout(timeout);
            if (interval !== undefined) clearInterval(interval);
        };
    }, [userId]);

    // Navigation handlers for menu items
    const handleProfileClick = () => {
        handleUserMenuClose();
        navigate('/profile');
    };

    const handleChangePasswordClick = () => {
        handleUserMenuClose();
        navigate('/change-password');
    };

    return (
        <AppBar
            position="fixed"
            elevation={darkMode ? 2 : 1}
            sx={{
                width: { sm: `calc(100% - ${240}px)` },
                ml: { sm: `${240}px` },
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${theme.palette.divider}`,
                transition: theme.transitions.create(['background-color', 'box-shadow'], {
                    duration: theme.transitions.duration.standard,
                }),
                minHeight: { xs: 56, sm: 64 },
            }}
        >
            <Toolbar
                sx={{
                    justifyContent: 'space-between',
                    minHeight: { xs: 56, sm: 64 },
                    px: { xs: 1, sm: 2 }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{
                            mr: { xs: 1, sm: 2 },
                            display: { sm: 'none' },
                            minWidth: TOUCH_TARGETS.MINIMUM,
                            minHeight: TOUCH_TARGETS.MINIMUM
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        noWrap
                        component="div"
                        sx={{
                            fontWeight: 600,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        {activeSectionLabel}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    <Tooltip title={`You have ${unreadCount} unread messages`}>
                        <IconButton
                            onClick={() => navigate('/messages')}
                            color="inherit"
                            size={isSmallMobile ? "small" : "medium"}
                            sx={{
                                minWidth: TOUCH_TARGETS.MINIMUM,
                                minHeight: TOUCH_TARGETS.MINIMUM,
                                transition: theme.transitions.create('transform', {
                                    duration: theme.transitions.duration.shorter,
                                }),
                                '&:hover': {
                                    transform: 'scale(1.1)',
                                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                },
                            }}
                        >
                            <Badge
                                badgeContent={unreadCount}
                                color="error"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                        minWidth: { xs: 16, sm: 20 },
                                        height: { xs: 16, sm: 20 },
                                    }
                                }}
                            >
                                <MailIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {toggleDarkMode && (
                        <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                            <IconButton
                                onClick={toggleDarkMode}
                                color="inherit"
                                size={isSmallMobile ? "small" : "medium"}
                                sx={{
                                    minWidth: TOUCH_TARGETS.MINIMUM,
                                    minHeight: TOUCH_TARGETS.MINIMUM,
                                    transition: theme.transitions.create('transform', {
                                        duration: theme.transitions.duration.shorter,
                                    }),
                                    '&:hover': {
                                        transform: 'scale(1.1)',
                                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                {darkMode ? (
                                    <Brightness7Icon sx={{
                                        color: theme.palette.mode === 'dark' ? '#ffeb3b' : 'inherit',
                                        fontSize: { xs: '1.2rem', sm: '1.5rem' }
                                    }} />
                                ) : (
                                    <Brightness4Icon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}

                    <IconButton
                        size={isSmallMobile ? "small" : "medium"}
                        edge="end"
                        aria-label="account menu"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleUserMenuOpen}
                        color="inherit"
                        sx={{
                            minWidth: TOUCH_TARGETS.MINIMUM,
                            minHeight: TOUCH_TARGETS.MINIMUM
                        }}
                    >
                        <Avatar sx={{
                            width: { xs: 28, sm: 32 },
                            height: { xs: 28, sm: 32 },
                            bgcolor: 'primary.main'
                        }}>
                            <AccountCircleIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                        </Avatar>
                    </IconButton>
                </Box>

                <Menu
                    id="menu-appbar"
                    anchorEl={userMenuAnchorEl}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(userMenuAnchorEl)}
                    onClose={handleUserMenuClose}
                    slotProps={{
                        paper: {
                            sx: {
                                mt: 1,
                                minWidth: 160,
                                borderRadius: 2,
                                boxShadow: theme.shadows[8],
                            }
                        }
                    }}
                >
                    {hasMultipleRoles && (
                        <MenuItem
                            onClick={handleUserMenuClose}
                            sx={{
                                minHeight: TOUCH_TARGETS.MINIMUM,
                                px: 2,
                                py: 1.5,
                                fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}
                        >
                            Switch Role
                        </MenuItem>
                    )}
                    <MenuItem
                        onClick={handleProfileClick}
                        sx={{
                            minHeight: TOUCH_TARGETS.MINIMUM,
                            px: 2,
                            py: 1.5,
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                    >
                        <PersonIcon
                            fontSize="small"
                            sx={{
                                mr: 1.5,
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}
                        />
                        Profile
                    </MenuItem>
                    <MenuItem
                        onClick={handleChangePasswordClick}
                        sx={{
                            minHeight: TOUCH_TARGETS.MINIMUM,
                            px: 2,
                            py: 1.5,
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                    >
                        <LockResetIcon
                            fontSize="small"
                            sx={{
                                mr: 1.5,
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}
                        />
                        Change Password
                    </MenuItem>
                    <MenuItem
                        onClick={logout}
                        sx={{
                            minHeight: TOUCH_TARGETS.MINIMUM,
                            px: 2,
                            py: 1.5,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            color: 'error.main'
                        }}
                    >
                        <LogoutIcon
                            fontSize="small"
                            sx={{
                                mr: 1.5,
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}
                        />
                        Logout
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
