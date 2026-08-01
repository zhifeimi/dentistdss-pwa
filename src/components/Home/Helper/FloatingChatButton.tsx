import React, { memo } from 'react';
import {
  Fab,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';

/**
 * Floating Chat Button Props Interface
 */
interface FloatingChatButtonProps {
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly onClick: () => void;
}

/**
 * Floating Chat Button Component
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only handles the floating button UI
 * - Open/Closed: Extensible through props interface
 * - Liskov Substitution: Can be replaced with different button implementations
 * - Interface Segregation: Focused interface for button operations
 * - Dependency Inversion: Depends on abstractions through props
 */
export const FloatingChatButton: React.FC<FloatingChatButtonProps> = memo(({
  isOpen,
  isLoading,
  onClick,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getButtonStyles = () => ({
    bgcolor: isOpen 
      ? (isDarkMode ? '#6C47FF' : 'secondary.main') 
      : (isDarkMode ? '#7C5CFF' : 'primary.main'),
    boxShadow: isDarkMode 
      ? '0 2px 12px rgba(108, 71, 255, 0.35)' 
      : '0 2px 8px rgba(0, 0, 0, 0.2)',
    width: { xs: 48, sm: 56 },
    height: { xs: 48, sm: 56 },
    '&.Mui-disabled': {
      bgcolor: isDarkMode ? '#424242' : '#e0e0e0',
    },
    '&:hover': {
      bgcolor: isOpen 
        ? (isDarkMode ? '#5636E8' : theme.palette.secondary.dark) 
        : (isDarkMode ? '#5636E8' : theme.palette.primary.dark),
    },
    transition: theme.transitions.create(['background-color', 'box-shadow'], {
      duration: theme.transitions.duration.short,
    }),
  });

  const renderButtonContent = () => {
    if (isLoading) {
      return (
        <CircularProgress 
          size={isSmallMobile ? 20 : 24} 
          color="inherit"
          sx={{ 
            color: theme.palette.primary.contrastText,
          }}
        />
      );
    }

    return (
      <HelpIcon 
        sx={{ 
          fontSize: { xs: '1.2rem', sm: '1.5rem' },
          color: theme.palette.primary.contrastText,
        }}
      />
    );
  };

  return (
    <Tooltip 
      title="Chat with Dentabot" 
      arrow 
      placement="left"
      enterDelay={500}
      leaveDelay={200}
    >
      <span> {/* Wrapper span needed for disabled Tooltip */}
        <Fab
          color="primary"
          aria-label="chat"
          onClick={onClick}
          size={isSmallMobile ? "medium" : "large"}
          disabled={isLoading}
          sx={getButtonStyles()}
        >
          {renderButtonContent()}
        </Fab>
      </span>
    </Tooltip>
  );
});

FloatingChatButton.displayName = 'FloatingChatButton';

export default FloatingChatButton;
