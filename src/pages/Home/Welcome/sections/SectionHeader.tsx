import React from 'react';
import { Box, Typography } from '@mui/material';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: 'left' | 'center';
}

/**
 * SectionHeader — the eyebrow / title / subcopy trio every landing section
 * opens with, in the rich-SaaS register (small violet caps eyebrow, quiet
 * h3, one secondary line).
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({ eyebrow, title, sub, align = 'center' }) => (
  <Box sx={{ textAlign: align, mb: { xs: 4, md: 6 }, maxWidth: 640, mx: align === 'center' ? 'auto' : 0 }}>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'primary.main',
        fontSize: '0.75rem',
        mb: 1.5,
      }}
    >
      {eyebrow}
    </Typography>
    <Typography variant="h3" component="h2" sx={{ fontWeight: 600, color: 'text.primary', mb: sub ? 1.5 : 0 }}>
      {title}
    </Typography>
    {sub && (
      <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
        {sub}
      </Typography>
    )}
  </Box>
);

export default SectionHeader;
