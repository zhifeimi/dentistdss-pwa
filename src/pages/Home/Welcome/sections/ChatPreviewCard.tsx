import React from 'react';
import { alpha, Box, Typography, useTheme } from '@mui/material';

const EXCHANGE: { from: 'user' | 'bot'; text: string }[] = [
  { from: 'user', text: 'My lower left molar hurts when I drink cold water. Should I worry?' },
  {
    from: 'bot',
    text:
      'Cold sensitivity can come from enamel wear, a small cavity or gum recession. If it lingers for more than a few seconds or wakes you at night, book an exam soon.',
  },
  { from: 'user', text: 'It only stings for a second.' },
  {
    from: 'bot',
    text:
      'That pattern is usually mild. Try a sensitivity toothpaste for two weeks. If it keeps happening, I can help you find a clinic nearby.',
  },
];

/**
 * ChatPreviewCard — a static example of a Dentabot conversation. Purely
 * illustrative: no chat wiring, exposed to assistive tech as one image.
 */
const ChatPreviewCard: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      role="img"
      aria-label="Example conversation with Dentabot about a sensitive tooth"
      sx={{
        width: '100%',
        maxWidth: 440,
        mx: 'auto',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2.5,
          py: 1.75,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
        <Typography variant="subtitle2">Dentabot</Typography>
      </Box>
      <Box aria-hidden sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, p: 2.5 }}>
        {EXCHANGE.map(({ from, text }) => (
          <Box
            key={text}
            sx={{
              alignSelf: from === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              px: 1.75,
              py: 1.25,
              borderRadius: from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              bgcolor: from === 'user'
                ? 'primary.main'
                : alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.05),
              color: from === 'user' ? 'primary.contrastText' : 'text.primary',
            }}
          >
            <Typography variant="body2">{text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ChatPreviewCard;
