import React from 'react';
import { alpha, Box, Typography, useTheme } from '@mui/material';
import { BrandMark } from '../../../../components/shared/BrandMark';

type Kind = 'checkup' | 'treatment' | 'newPatient' | 'long';

// Rows are 30-minute slots from 8:30; `row` is the first slot, `span` how many.
const COLUMNS: { dentist: string; visits: { row: number; span: number; who: string; what: string; kind: Kind }[] }[] = [
  {
    dentist: 'Dr Tanaka',
    visits: [
      { row: 0, span: 2, who: 'Lena Hart', what: 'Crown fitting', kind: 'treatment' },
      { row: 2, span: 1, who: 'Sam Ortiz', what: 'Check-up', kind: 'checkup' },
      { row: 4, span: 2, who: 'Priya Nair', what: 'New patient', kind: 'newPatient' },
    ],
  },
  {
    dentist: 'Dr Okafor',
    visits: [
      { row: 0, span: 1, who: 'Theo Park', what: 'Check-up', kind: 'checkup' },
      { row: 1, span: 2, who: 'Ava Collins', what: 'Filling', kind: 'treatment' },
      { row: 4, span: 3, who: 'Noah Reid', what: 'Root canal', kind: 'long' },
    ],
  },
];

const TIMES = ['8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30'];
const ROW = 40;

/**
 * ClinicSchedulePreview — a code-built product shot of the clinic side: the
 * day's schedule across two dentists. Decorative; one image to assistive tech.
 */
const ClinicSchedulePreview: React.FC = () => {
  const theme = useTheme();
  const { palette } = theme;
  const kindColor: Record<Kind, string> = {
    checkup: palette.primary.main,
    treatment: palette.info.main,
    newPatient: palette.secondary.main,
    long: palette.warning.main,
  };

  return (
    <Box
      role="img"
      aria-label="Preview of a clinic's schedule in DentistDSS, with two dentists' appointments for the morning"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '56px 1fr' },
        boxShadow: theme.shadows[16],
      }}
    >
      {/* Collapsed sidebar rail */}
      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          py: 2,
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        <BrandMark size={28} />
        {[true, false, false, false].map((active, index) => (
          <Box
            key={index}
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: active ? alpha(palette.primary.main, 0.12) : 'transparent',
              border: active ? 0 : 1,
              borderColor: 'divider',
            }}
          />
        ))}
      </Box>

      <Box aria-hidden sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            px: 2.5,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Today's schedule</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[['14', 'booked'], ['4', 'open'], ['2', 'new patients']].map(([n, label]) => (
              <Typography key={label} variant="body2" sx={{ color: 'text.secondary' }}>
                <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{n}</Box>{' '}
                {label}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr' }}>
          <Box />
          {COLUMNS.map(({ dentist }) => (
            <Typography
              key={dentist}
              variant="body2"
              sx={{ fontWeight: 650, px: 1.5, py: 1, borderLeft: 1, borderColor: 'divider' }}
            >
              {dentist}
            </Typography>
          ))}

          <Box>
            {TIMES.map((time) => (
              <Typography
                key={time}
                variant="caption"
                sx={{
                  display: 'block',
                  height: ROW,
                  pr: 1,
                  pt: 0.25,
                  textAlign: 'right',
                  color: 'text.secondary',
                  borderTop: 1,
                  borderColor: 'divider',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {time}
              </Typography>
            ))}
          </Box>

          {COLUMNS.map(({ dentist, visits }) => (
            <Box
              key={dentist}
              sx={{
                position: 'relative',
                borderLeft: 1,
                borderColor: 'divider',
                backgroundImage: `repeating-linear-gradient(to bottom, ${palette.divider} 0 1px, transparent 1px ${ROW}px)`,
                height: ROW * TIMES.length,
              }}
            >
              {visits.map(({ row, span, who, what, kind }) => (
                <Box
                  key={who}
                  sx={{
                    position: 'absolute',
                    top: row * ROW + 3,
                    height: span * ROW - 6,
                    left: 6,
                    right: 6,
                    px: 1,
                    py: 0.5,
                    borderRadius: 0.75,
                    borderLeft: 3,
                    borderColor: kindColor[kind],
                    bgcolor: alpha(kindColor[kind], palette.mode === 'dark' ? 0.2 : 0.1),
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, lineHeight: 1.3 }} noWrap>
                    {who}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.3 }} noWrap>
                    {what}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ClinicSchedulePreview;
