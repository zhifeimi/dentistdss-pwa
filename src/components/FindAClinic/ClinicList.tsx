import React from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import ClinicCard from './ClinicCard';
import type { ClinicSearchResult } from '../../types/api';

interface ClinicListProps {
  clinics: ClinicSearchResult[];
  selectedClinic?: ClinicSearchResult | null;
  loading: boolean;
  /** The search request failed: say so instead of "no matches" */
  failed?: boolean;
  onRetry?: () => void;
  hasQuery: boolean;
  isMobile: boolean;
  onClinicSelect: (clinic: ClinicSearchResult) => void;
}

const Message: React.FC<{ title: string; text: string; action?: React.ReactNode }> = ({ title, text, action }) => (
  <Box
    sx={{
      p: 3,
      border: 1,
      borderColor: 'divider',
      borderStyle: 'dashed',
      borderRadius: 2,
    }}
  >
    <Typography variant="subtitle1">{title}</Typography>
    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
      {text}
    </Typography>
    {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
  </Box>
);

/** ClinicList — search results with loading, empty and no-match states. */
const ClinicList = React.memo<ClinicListProps>(({
  clinics,
  selectedClinic,
  loading,
  failed = false,
  onRetry,
  hasQuery,
  onClinicSelect,
}) => (
  <Box component="section" aria-labelledby="clinic-results-heading" aria-busy={loading}>
    <Typography
      id="clinic-results-heading"
      variant="subtitle1"
      component="h2"
      sx={{ mb: 1.5 }}
      aria-live="polite"
    >
      {loading
        ? 'Searching clinics…'
        : failed
        ? 'Clinics'
        : hasQuery
        ? `${clinics.length} ${clinics.length === 1 ? 'clinic' : 'clinics'}`
        : 'Clinics'}
    </Typography>

    {loading ? (
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={148} />)}
      </Box>
    ) : failed ? (
      <Message
        title="Couldn't search clinics"
        text="Something went wrong on our side or with your connection. Your search is still there; try again."
        action={onRetry && <Button variant="outlined" size="small" onClick={onRetry}>Retry</Button>}
      />
    ) : !hasQuery ? (
      <Message
        title="Start with a suburb or clinic name"
        text="Type in the search box above and matching clinics will appear here."
      />
    ) : clinics.length === 0 ? (
      <Message
        title="No clinics match that search"
        text="Check the spelling, or try a nearby suburb or a broader treatment such as “check-up”."
      />
    ) : (
      <Box component="ul" aria-label="Clinic search results" sx={{ display: 'grid', gap: 1.5, p: 0, m: 0 }}>
        {clinics.map((clinic, index) => (
          <ClinicCard
            key={clinic.id || index}
            clinic={clinic}
            isSelected={selectedClinic?.id === clinic.id}
            onClick={() => onClinicSelect(clinic)}
          />
        ))}
      </Box>
    )}
  </Box>
));

ClinicList.displayName = 'ClinicList';

export default ClinicList;
