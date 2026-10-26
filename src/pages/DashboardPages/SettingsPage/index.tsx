import React, { useState, useEffect } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../context/auth';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import api from '../../../services';
import SystemSettingsSection from './components/SystemSettingsSection';
import ClinicInformationForm from './components/ClinicInformationForm';
import { UserRole, Clinic } from '../../../types';

interface SettingsPageProps {
  userRole?: UserRole;
}

/**
 * SettingsPage - Unified settings page for admin roles
 *
 * Clinic admins edit their clinic's details; system admins edit system settings.
 */
const SettingsPage: React.FC<SettingsPageProps> = ({ userRole = 'CLINIC_ADMIN' }) => {
  const [clinicDetails, setClinicDetails] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { currentUser } = useAuth() || {};

  // Load settings data
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError('');

      try {
        if (userRole === 'CLINIC_ADMIN') {
          if (!currentUser?.clinicId) {
            setError('No clinic information available for this user.');
            setLoading(false);
            return;
          }
          const data = await api.clinic.getClinicById(currentUser.clinicId);
          setClinicDetails(data);
        }
        // System admin settings would be loaded here
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userRole, currentUser?.clinicId]);

  /**
   * Handle clinic data update
   */
  const handleClinicUpdate = (updatedClinic: Clinic) => {
    setClinicDetails(updatedClinic);
  };

  /**
   * Render clinic admin settings
   */
  const renderClinicSettings = () => (
    <ClinicInformationForm
      clinicData={clinicDetails || undefined}
      onUpdate={handleClinicUpdate}
    />
  );

  /**
   * Render system admin settings
   */
  const renderSystemSettings = () => (
    <SystemSettingsSection />
  );

  const isClinicAdmin = userRole === 'CLINIC_ADMIN';

  return (
    <>
      <PageHeader
        title={isClinicAdmin ? 'Clinic details' : 'System settings'}
        description={
          isClinicAdmin
            ? 'What patients see when they search for and book your clinic.'
            : 'Settings that apply to every clinic on DentistDSS.'
        }
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading settings" />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : isClinicAdmin ? (
        renderClinicSettings()
      ) : userRole === 'SYSTEM_ADMIN' ? (
        renderSystemSettings()
      ) : (
        <Alert severity="warning">Settings aren't available for this role.</Alert>
      )}
    </>
  );
};

export default SettingsPage;
