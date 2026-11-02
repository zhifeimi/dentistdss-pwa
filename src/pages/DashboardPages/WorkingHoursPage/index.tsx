import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import api from '../../../services';
import type { OperatingHours } from '../../../types';

interface WorkingHoursPageProps {
  clinicId?: number;
}

// Monday first, as Australian clinics list their hours.
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '17:00';

type Week = Record<number, OperatingHours>;

/** One entry per day: what the clinic saved, or closed with default times. */
function toWeek(saved: OperatingHours[] | undefined): Week {
  const week: Week = {};
  for (const day of WEEK) week[day] = { dayOfWeek: day, openTime: DEFAULT_OPEN, closeTime: DEFAULT_CLOSE, isOpen: false };
  for (const entry of saved ?? []) {
    if (entry.dayOfWeek >= 0 && entry.dayOfWeek <= 6) {
      week[entry.dayOfWeek] = {
        dayOfWeek: entry.dayOfWeek,
        openTime: entry.openTime || DEFAULT_OPEN,
        closeTime: entry.closeTime || DEFAULT_CLOSE,
        isOpen: Boolean(entry.isOpen),
      };
    }
  }
  return week;
}

const dayError = (day: OperatingHours) =>
  day.isOpen && !(day.openTime < day.closeTime) ? 'Closing time must be after opening time' : '';

/**
 * WorkingHoursPage — the clinic's opening hours, day by day. They are saved
 * on the clinic (PUT /api/clinic/{id}), shown on its public page and marked up
 * for search engines.
 */
const WorkingHoursPage: React.FC<WorkingHoursPageProps> = ({ clinicId }) => {
  const { currentUser } = useAuth();
  const effectiveClinicId = clinicId || currentUser?.clinicId;
  const hasAdminAccess = currentUser?.roles?.includes('CLINIC_ADMIN');

  const [saved, setSaved] = useState<Week | null>(null);
  const [week, setWeek] = useState<Week | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!effectiveClinicId) {
      setError('No clinic is linked to your account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const clinic = await api.clinic.getClinicById(effectiveClinicId);
      const loaded = toWeek(clinic?.operatingHours);
      setSaved(loaded);
      setWeek(loaded);
    } catch {
      setError("Opening hours didn't load. Refresh the page to try again.");
    } finally {
      setLoading(false);
    }
  }, [effectiveClinicId]);

  useEffect(() => {
    if (hasAdminAccess) load();
  }, [hasAdminAccess, load]);

  if (!hasAdminAccess) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Access denied. Only clinic administrators can manage opening hours.</Alert>
      </Box>
    );
  }

  const header = (
    <PageHeader
      title="Opening hours"
      description="The hours your clinic is open, day by day. They appear on your public clinic page."
    />
  );

  if (loading || !week) {
    return (
      <Box>
        {header}
        {error
          ? <Alert severity="error">{error}</Alert>
          : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress aria-label="Loading opening hours" />
            </Box>
          )}
      </Box>
    );
  }

  const update = (dayOfWeek: number, change: Partial<OperatingHours>) =>
    setWeek((current) => current && { ...current, [dayOfWeek]: { ...current[dayOfWeek], ...change } });

  const errors = WEEK.map((day) => dayError(week[day]));
  const hasChanges = JSON.stringify(week) !== JSON.stringify(saved);

  const handleSave = async () => {
    if (!effectiveClinicId || errors.some(Boolean)) return;
    setSaving(true);
    setError('');
    try {
      const operatingHours = WEEK.map((day) => week[day]);
      const updated = await api.clinic.updateClinic(effectiveClinicId, { operatingHours });
      const next = toWeek(updated?.operatingHours ?? operatingHours);
      setSaved(next);
      setWeek(next);
      window.dispatchEvent(new CustomEvent('show-snackbar', {
        detail: { message: 'Opening hours saved', severity: 'success' },
      }));
    } catch (err) {
      setError((err as Error).message || "Opening hours weren't saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {header}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component="ul" aria-label="Weekly opening hours" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {WEEK.map((day, index) => {
              const entry = week[day];
              const name = DAY_NAMES[day];
              return (
                <Box
                  component="li"
                  key={day}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: '140px 140px 1fr 1fr' },
                    gap: 2,
                    alignItems: 'center',
                    py: 1.5,
                    borderTop: index ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={entry.isOpen}
                        onChange={(event) => update(day, { isOpen: event.target.checked })}
                        disabled={saving}
                        slotProps={{ input: { 'aria-label': `Open on ${name}` } }}
                      />
                    }
                    label={entry.isOpen ? 'Open' : 'Closed'}
                  />
                  <TextField
                    type="time"
                    size="small"
                    label="Opens"
                    value={entry.openTime}
                    onChange={(event) => update(day, { openTime: event.target.value })}
                    disabled={!entry.isOpen || saving}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'aria-label': `${name} opens`, step: 300 } }}
                  />
                  <TextField
                    type="time"
                    size="small"
                    label="Closes"
                    value={entry.closeTime}
                    onChange={(event) => update(day, { closeTime: event.target.value })}
                    disabled={!entry.isOpen || saving}
                    error={Boolean(errors[index])}
                    helperText={errors[index]}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'aria-label': `${name} closes`, step: 300 } }}
                  />
                </Box>
              );
            })}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button variant="outlined" onClick={() => setWeek(saved)} disabled={saving || !hasChanges}>
              Discard changes
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !hasChanges || errors.some(Boolean)}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Saving…' : 'Save opening hours'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkingHoursPage;
