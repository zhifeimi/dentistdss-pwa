import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/auth';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import EmptyState from '../../../components/Dashboard/shared/EmptyState';
import api from '../../../services';
import type { ClinicService } from '../../../types';

interface ServicesPageProps {
  clinicId?: number;
}

const EMPTY_FORM = { name: '', durationMinutes: '30', price: '', description: '' };

/** Problems with the add-service form, keyed by field; empty when it can be saved. */
export function serviceFormErrors(form: typeof EMPTY_FORM): Partial<Record<keyof typeof EMPTY_FORM, string>> {
  const errors: Partial<Record<keyof typeof EMPTY_FORM, string>> = {};
  if (!form.name.trim()) errors.name = 'Enter a service name';
  const minutes = Number(form.durationMinutes);
  if (!Number.isInteger(minutes) || minutes < 15) errors.durationMinutes = 'At least 15 minutes';
  const price = Number(form.price);
  if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) errors.price = 'Enter a price (0 for free)';
  return errors;
}

const formatPrice = (price?: number) =>
  price === undefined || price === null ? '' : ` · $${Number(price).toFixed(2)}`;

/**
 * ServicesPage — the treatments the clinic offers. They are listed on its
 * public clinic page, and a listed clinic needs at least one before search
 * engines index that page.
 */
const ServicesPage: React.FC<ServicesPageProps> = ({ clinicId }) => {
  const { currentUser } = useAuth();
  const effectiveClinicId = clinicId || currentUser?.clinicId;
  const hasAdminAccess = currentUser?.roles?.includes('CLINIC_ADMIN');

  const [services, setServices] = useState<ClinicService[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!effectiveClinicId) {
      setError('No clinic is linked to your account.');
      return;
    }
    try {
      setServices(await api.clinic.getServices(effectiveClinicId));
    } catch {
      setError("Services didn't load. Refresh the page to try again.");
    }
  }, [effectiveClinicId]);

  useEffect(() => {
    if (hasAdminAccess) load();
  }, [hasAdminAccess, load]);

  if (!hasAdminAccess) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Access denied. Only clinic administrators can manage services.</Alert>
      </Box>
    );
  }

  const errors = serviceFormErrors(form);
  const shownErrors = touched ? errors : {};

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!effectiveClinicId || Object.keys(errors).length > 0) return;
    setBusy(true);
    setError('');
    try {
      await api.clinic.createService({
        clinicId: Number(effectiveClinicId),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
      });
      setForm(EMPTY_FORM);
      setTouched(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "The service wasn't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (service: ClinicService) => {
    setBusy(true);
    setError('');
    try {
      await api.clinic.deleteService(service.id);
      await load();
    } catch (err: any) {
      setError(err?.message || "The service wasn't removed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof EMPTY_FORM) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
    error: Boolean(shownErrors[key]),
    helperText: shownErrors[key] || ' ',
    disabled: busy,
  });

  return (
    <Box>
      <PageHeader
        title="Services"
        description="The treatments your clinic offers. They appear on your public clinic page."
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent component="form" onSubmit={handleAdd} noValidate
          sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' } }}>
          <TextField label="Service name" required {...field('name')} />
          <TextField label="Duration (minutes)" type="number" required
            slotProps={{ htmlInput: { min: 15, step: 5 } }} {...field('durationMinutes')} />
          <TextField label="Price (AUD)" type="number" required
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }} {...field('price')} />
          <TextField label="Description (optional)" multiline minRows={2} sx={{ gridColumn: '1 / -1' }}
            {...field('description')} />
          <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={busy}
              startIcon={busy ? <CircularProgress size={18} /> : <AddIcon />}>
              Add service
            </Button>
          </Box>
        </CardContent>
      </Card>

      {services === null && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading services" />
        </Box>
      )}
      {services?.length === 0 && (
        <EmptyState title="No services yet">
          Add the treatments you offer. A listed clinic needs at least one before search engines show its page.
        </EmptyState>
      )}
      {services && services.length > 0 && (
        <Card variant="outlined">
          <List disablePadding>
            {services.map((service) => (
              <ListItem
                key={service.id}
                divider
                secondaryAction={
                  <IconButton edge="end" aria-label={`Remove ${service.name}`} disabled={busy}
                    onClick={() => handleRemove(service)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={service.name}
                  secondary={`${service.durationMinutes} min${formatPrice(service.price)}${
                    service.description ? ` · ${service.description}` : ''}`}
                />
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
};

export default ServicesPage;
