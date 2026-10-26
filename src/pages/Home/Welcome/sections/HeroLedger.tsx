import React from 'react';
import { alpha, Box, Typography, useTheme } from '@mui/material';
import { keyframes } from '@emotion/react';

type SlotState = 'booked' | 'open' | 'selected';

const SLOTS: { time: string; state: SlotState }[] = [
  { time: '9:00', state: 'booked' },
  { time: '9:40', state: 'booked' },
  { time: '10:20', state: 'open' },
  { time: '11:00', state: 'booked' },
  { time: '1:30', state: 'booked' },
  { time: '2:10', state: 'open' },
  { time: '3:40', state: 'selected' },
  { time: '4:20', state: 'booked' },
];

// The page's one orchestrated moment: the chosen slot fills in once, as if
// the patient just picked it.
const fillIn = keyframes`
  from { background-color: transparent; color: inherit; }
`;

/**
 * HeroLedger — an illustration of one clinic's day as a ruled appointment
 * book: booked slots hatched out, open slots left blank, and the patient's
 * pick filled in. Decorative; exposed to assistive tech as one image.
 */
const HeroLedger: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const rule = theme.palette.divider;
  const hatch = alpha(theme.palette.text.primary, isDark ? 0.09 : 0.06);

  return (
    <Box
      role="img"
      aria-label="Example: a clinic's appointment book for Thursday, with 3:40 pm chosen"
      sx={{
        width: '100%',
        maxWidth: 440,
        mx: 'auto',
        bgcolor: 'background.paper',
        border: `1px solid ${rule}`,
        borderRadius: 2,
        boxShadow: theme.shadows[12],
        overflow: 'hidden',
      }}
    >
      <Box aria-hidden sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${rule}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Harbourside Dental
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            Thursday
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Dr Mei Tanaka, general dentist
        </Typography>
      </Box>

      <Box aria-hidden component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {SLOTS.map(({ time, state }) => (
          <Box
            component="li"
            key={time}
            sx={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr',
              alignItems: 'stretch',
              minHeight: 44,
              borderBottom: `1px solid ${rule}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                alignSelf: 'center',
                textAlign: 'right',
                pr: 1.5,
                color: 'text.secondary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {time}
            </Typography>
            <Box
              sx={{
                borderLeft: `1px solid ${rule}`,
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                ...(state === 'booked' && {
                  backgroundImage: `repeating-linear-gradient(135deg, ${hatch} 0 6px, transparent 6px 12px)`,
                }),
              }}
            >
              {state === 'booked' && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Booked</Typography>
              )}
              {state === 'open' && (
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 650 }}>
                  Open
                </Typography>
              )}
              {state === 'selected' && (
                <Box
                  sx={{
                    flex: 1,
                    my: 0.5,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                    animation: `${fillIn} 480ms ${theme.transitions.easing.easeOut} 700ms both`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>3:40 pm</Typography>
                  <Typography variant="body2">Check-up and clean</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2 }}>
        <Box
          sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main', flexShrink: 0 }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          2 more times open today
        </Typography>
      </Box>
    </Box>
  );
};

export default HeroLedger;
