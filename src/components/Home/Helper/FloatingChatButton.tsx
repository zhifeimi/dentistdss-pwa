import React, { memo } from 'react';
import {
  Fab,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/ChatBubbleOutlineRounded';

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
const FloatingChatButton: React.FC<FloatingChatButtonProps> = memo(({
  isOpen,
  isLoading,
  onClick,
}) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const renderButtonContent = () => {
    if (isLoading) {
      return (
        <CircularProgress size={isSmallMobile ? 20 : 24} color="inherit" />
      );
    }

    return (
      <ChatIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
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
          sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}
        >
          {renderButtonContent()}
        </Fab>
      </span>
    </Tooltip>
  );
});

FloatingChatButton.displayName = 'FloatingChatButton';

export default FloatingChatButton;
