import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';

interface ThemeToggleButtonProps {
  darkMode: boolean;
  onToggle: () => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ darkMode, onToggle }) => {
  const label = darkMode ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <Tooltip title={label}>
      <IconButton onClick={onToggle} aria-label={label} sx={{ color: 'text.secondary' }}>
        {darkMode ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
