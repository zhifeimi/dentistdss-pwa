import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';

/**
 * ChatPreviewCard — the hero's product preview: a hand-built mock of the
 * Dentabot chat window. Purely illustrative (static bubbles, disabled
 * input) — no chat wiring, no stock imagery.
 */
const ChatPreviewCard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const bubble = (from: 'user' | 'bot', text: string) => (
    <Box
      key={text}
      sx={{
        alignSelf: from === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        px: 1.75,
        py: 1.25,
        borderRadius: from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        bgcolor: from === 'user' ? 'primary.main' : (isDark ? '#2a2a31' : '#f1f1f4'),
        color: from === 'user' ? 'primary.contrastText' : 'text.primary',
      }}
    >
      <Typography variant="body2" sx={{ lineHeight: 1.55 }}>{text}</Typography>
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 420,
        mx: 'auto',
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDark
          ? '0 24px 60px rgba(0, 0, 0, 0.55)'
          : '0 24px 60px rgba(76, 47, 190, 0.18)',
        transform: 'rotate(1.5deg)',
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'rotate(0deg)' },
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Dentabot</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>online</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, p: 2 }}>
        {bubble('user', 'My lower left molar hurts when I drink cold water. Should I worry?')}
        {bubble('bot', 'Cold sensitivity can come from enamel wear, a small cavity, or gum recession. If it lingers past a few days or wakes you at night, book an exam soon.')}
        {bubble('user', 'It only stings for a second.')}
        {bubble('bot', 'That pattern is usually mild. Try a sensitivity toothpaste for two weeks — if it persists, I can help you find a clinic nearby.')}
      </Box>
      <Box
        sx={{
          mx: 2,
          mb: 2,
          px: 1.75,
          py: 1.25,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">Type your message...</Typography>
      </Box>
    </Paper>
  );
};

export default ChatPreviewCard;
