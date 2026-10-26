import React from 'react';
import { useAuth } from '../../../context/auth';
import MessagePanel from '../../../components/MessagePanel';
import PageHeader from '../../../components/Dashboard/shared/PageHeader';

/** MessagesPage - the same inbox for every role */
const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth() || {};
  const userId = currentUser?.uid || currentUser?.id || 'defaultUser';

  return (
    <>
      <PageHeader title="Your messages" description="Updates and notes sent to you through DentistDSS." />
      <MessagePanel userId={Number(userId)} />
    </>
  );
};

export default MessagesPage;
