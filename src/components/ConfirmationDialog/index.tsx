import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  useTheme,
  Avatar,
  type DialogProps,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const DefaultTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

type DialogType = 'success' | 'error' | 'warning' | 'info';

interface DialogTypeConfig {
  icon: React.ComponentType;
  color: string;
  backgroundColor: string;
  iconColor: string;
}

// Dialog type configurations
const dialogTypeConfig: Record<DialogType, DialogTypeConfig> = {
  success: {
    icon: SuccessIcon,
    color: 'success.main',
    backgroundColor: 'success.light',
    iconColor: 'success.contrastText',
  },
  error: {
    icon: ErrorIcon,
    color: 'error.main',
    backgroundColor: 'error.light',
    iconColor: 'error.contrastText',
  },
  warning: {
    icon: WarningIcon,
    color: 'warning.main',
    backgroundColor: 'warning.light',
    iconColor: 'warning.contrastText',
  },
  info: {
    icon: InfoIcon,
    color: 'info.main',
    backgroundColor: 'info.light',
    iconColor: 'info.contrastText',
  },
};

interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to close the dialog */
  onClose: () => void;
  /** Function to handle confirm action */
  onConfirm?: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message content */
  message: string | React.ReactNode;
  /** Dialog type for styling and icon */
  type?: DialogType;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Whether to show cancel button */
  showCancel?: boolean;
  /** Custom transition component */
  TransitionComponent?: React.ComponentType<TransitionProps & { children: React.ReactElement }>;
  /** Whether to prevent closing on backdrop click */
  hideBackdropClick?: boolean;
  /** Whether to prevent closing on escape key */
  disableEscapeKeyDown?: boolean;
  /** Whether to show the type icon */
  showIcon?: boolean;
  /** Maximum width of the dialog */
  maxWidth?: DialogProps['maxWidth'];
}

/**
 * Enhanced ConfirmationDialog - A reusable dialog for user notifications
 *
 * Features:
 * - Support for different dialog types (success, error, warning, info)
 * - Dynamic titles and messages
 * - Appropriate icons and colors for each type
 * - Consistent Material-UI styling
 * - Proper accessibility attributes
 * - TypeScript support with comprehensive prop types
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  TransitionComponent = DefaultTransition,
  hideBackdropClick = true,
  disableEscapeKeyDown = true,
  showIcon = true,
  maxWidth = 'sm',
  ...otherProps
}) => {
  const theme = useTheme();
  const config = dialogTypeConfig[type] || dialogTypeConfig.info;
  const IconComponent = config.icon;

  const handleDialogClose: NonNullable<DialogProps['onClose']> = (_event, reason) => {
    if (hideBackdropClick && reason === 'backdropClick') {
      return;
    }
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      slots={{ transition: TransitionComponent }}
      keepMounted
      onClose={handleDialogClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
          }
        }
      }}
      {...otherProps}
    >
      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          fontWeight: 'medium',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1
        }}
      >
        {showIcon && (
          <Avatar
            sx={{
              bgcolor: config.backgroundColor,
              color: config.iconColor,
              width: 40,
              height: 40,
            }}
          >
            <IconComponent />
          </Avatar>
        )}
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="confirmation-dialog-description"
          sx={{
            fontSize: '1rem',
            color: 'text.primary',
            mt: showIcon ? 1 : 0
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        {showCancel && (
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ minWidth: 100 }}
          >
            {cancelText}
          </Button>
        )}
        <Button
          onClick={onConfirm || onClose}
          color={type === 'error' ? 'error' : 'primary'}
          variant="contained"
          autoFocus
          sx={{ minWidth: 100 }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
