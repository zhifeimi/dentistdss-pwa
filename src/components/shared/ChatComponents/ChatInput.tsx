import React, { ChangeEvent, KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface QuickAction {
  label: string;
  onClick: () => void;
}

interface ChatInputProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSend: () => void;
  onKeyPress: (event: KeyboardEvent<HTMLDivElement>) => void;
  placeholder: string;
  isLoading: boolean;
  quickActions?: QuickAction[];
  maxRows?: number;
  isMobile?: boolean;
}

/**
 * Reusable chat input component with quick action buttons
 */
const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  placeholder,
  isLoading,
  quickActions = [],
  maxRows = 4
}) => {
  return (
    <>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={maxRows}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={() => onSend()}
            disabled={!value.trim() || isLoading}
            sx={{ mb: 0.5 }}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
        
        {/* Quick action buttons */}
        {quickActions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="small"
                variant="outlined"
                onClick={() => action.onClick()}
                disabled={isLoading}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
};

export default ChatInput;
