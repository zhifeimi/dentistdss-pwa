import React, { useState, useEffect } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../../context/auth';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import EmptyState from '../../../components/Dashboard/shared/EmptyState';
import api from '../../../services';

interface PatientRecord {
  id: string | number;
  patientName?: string;
  name?: string;
  lastVisit?: string;
  treatment?: string;
  notes?: string;
}

/**
 * PatientRecordsPage - Patient records page for dentists
 *
 * Visit history and notes for the patients a dentist has seen.
 */
const PatientRecordsPage: React.FC = () => {
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { currentUser } = useAuth() || {};

  // Load patient records data
  useEffect(() => {
    const loadPatientRecords = async () => {
      if (!currentUser?.id) {
        setError('No user information available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await api.clinic.getDentistPatientRecords(currentUser.id);
        setPatientRecords(data || []);
      } catch (err) {
        console.error('Failed to load patient records:', err);
        setError('Failed to load patient records. Please try again later.');
        // Return empty array on error instead of mock data
        setPatientRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadPatientRecords();
  }, [currentUser?.id]);

  return (
    <>
      <PageHeader title="Your patients" description="Visit history and notes for the patients you have seen." />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading patient records" />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : patientRecords.length === 0 ? (
        <EmptyState title="No patient records yet">
          Records for patients you have treated show up here.
        </EmptyState>
      ) : (
        <Box
          component="ul"
          sx={{ m: 0, p: 0, listStyle: 'none', border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
        >
          {patientRecords.map((record, index) => (
            <Box
              component="li"
              key={record.id || index}
              sx={{ px: { xs: 2, sm: 3 }, py: 2, '& + &': { borderTop: 1, borderColor: 'divider' } }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 2 }}>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 650 }}>
                  {record.patientName || record.name || 'Unknown patient'}
                </Typography>
                {record.lastVisit && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                    Last visit {record.lastVisit}
                  </Typography>
                )}
              </Box>
              {(record.treatment || record.notes) && (
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {record.treatment || record.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};

export default PatientRecordsPage;
