import React from 'react';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';
import EmptyState from '../../../components/Dashboard/shared/EmptyState';

/**
 * DentalRecordsPage - Dental records page for patients (records are not
 * served to patients yet, so this is its empty state)
 */
const DentalRecordsPage: React.FC = () => (
  <>
    <PageHeader title="Your dental records" description="Treatment history and notes from your clinic visits." />
    <EmptyState title="No records to show yet">
      Treatment history, X-rays and notes from your dentist will show up here.
    </EmptyState>
  </>
);

export default DentalRecordsPage;
