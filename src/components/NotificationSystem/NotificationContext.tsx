import { createContext, useContext } from 'react';
import type { NotificationContextType } from '../../types/components';

// Notification Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export { NotificationContext };
export type { NotificationContextType };
