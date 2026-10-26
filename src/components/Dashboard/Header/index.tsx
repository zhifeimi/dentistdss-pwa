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
    ListItemIcon,
    Divider,
    Avatar,
    Tooltip,
    Badge,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LockResetIcon from '@mui/icons-material/LockReset';
import ThemeToggleButton from '../../shared/ThemeToggleButton';
import { useAuth } from '../../../context/auth';
import { getDisplayName, getInitials } from '../../../utils/dashboard/dashboardUtils';
import api from '../../../services';

interface HeaderProps {
    handleDrawerToggle: () => void;
    activeSectionLabel: string;
    drawerWidth: number;
    userMenuAnchorEl: HTMLElement | null;
    handleUserMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
    handleUserMenuClose: () => void;
    darkMode?: boolean;
    toggleDarkMode?: () => void;
    logout: () => void;
}

const Header: React.FC<HeaderProps> = ({
    handleDrawerToggle,
    activeSectionLabel,
    drawerWidth,
    userMenuAnchorEl,
    handleUserMenuOpen,
    handleUserMenuClose,
    darkMode,
    toggleDarkMode,
    logout,
}) => {
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

    const goTo = (path: string) => () => {
        handleUserMenuClose();
        navigate(path);
    };

    const messagesLabel = unreadCount > 0 ? `Messages, ${unreadCount} unread` : 'Messages';

    return (
        <AppBar
            position="fixed"
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
            }}
        >
            <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, gap: 1, px: { xs: 1, sm: 3 } }}>
                <IconButton
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {activeSectionLabel}
                </Typography>

                <Tooltip title={messagesLabel}>
                    <IconButton
                        onClick={() => navigate('/messages')}
                        aria-label={messagesLabel}
                        sx={{ color: 'text.secondary' }}
                    >
                        <Badge badgeContent={unreadCount} color="secondary">
                            <MailOutlinedIcon fontSize="small" />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {toggleDarkMode && <ThemeToggleButton darkMode={Boolean(darkMode)} onToggle={toggleDarkMode} />}

                <IconButton
                    edge="end"
                    aria-label="account menu"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleUserMenuOpen}
                    sx={{ ml: 0.5 }}
                >
                    <Avatar
                        sx={(theme) => ({
                            width: 32,
                            height: 32,
                            fontSize: '0.8125rem',
                            fontWeight: 650,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                        })}
                    >
                        {getInitials(currentUser ?? undefined)}
                    </Avatar>
                </IconButton>

                <Menu
                    id="menu-appbar"
                    anchorEl={userMenuAnchorEl}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    keepMounted
                    open={Boolean(userMenuAnchorEl)}
                    onClose={handleUserMenuClose}
                    slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
                >
                    <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {getDisplayName(currentUser ?? undefined)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {currentUser?.email}
                        </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={goTo('/profile')}>
                        <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                        Profile
                    </MenuItem>
                    <MenuItem onClick={goTo('/change-password')}>
                        <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>
                        Change password
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={logout}>
                        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                        Log out
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
