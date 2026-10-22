import type { NotificationSettings, Notification } from '../../types/components';

/**
 * Utility functions for notification system
 * Extracted to follow Single Responsibility Principle
 */

/**
 * Check if current time is within quiet hours
 */
export const isQuietHours = (quietHours: NotificationSettings['quietHours']): boolean => {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startTime = parseInt(quietHours.start.split(':')[0]) * 60 +
      parseInt(quietHours.start.split(':')[1]);
  const endTime = parseInt(quietHours.end.split(':')[0]) * 60 +
      parseInt(quietHours.end.split(':')[1]);

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    return currentTime >= startTime || currentTime <= endTime;
  }
};

/**
 * Play notification sound
 */
export const playNotificationSound = (): void => {
  try {
    // Create a simple notification sound
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

/**
 * Request desktop notification permission
 */
export const requestDesktopPermission = async (): Promise<void> => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

/**
 * Show desktop notification
 */
export const showDesktopNotification = (notification: Notification): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: notification.id.toString(),
      requireInteraction: notification.urgent,
    });

    desktopNotification.onclick = () => {
      window.focus();
      desktopNotification.close();
    };

    setTimeout(() => {
      desktopNotification.close();
    }, 5000);
  }
};

/**
 * Format time ago string
 */
export const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/**
 * Get notification color
 */
export const getNotificationColor = (type: string): 'primary' | 'secondary' | 'info' | 'default' | 'success' | 'error' | 'warning' => {
  switch (type) {
    case 'appointment':
      return 'primary';
    case 'medical':
      return 'secondary';
    case 'patient':
      return 'info';
    case 'system':
      return 'default';
    case 'payment':
      return 'success';
    case 'security':
      return 'error';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'success':
      return 'success';
    default:
      return 'info';
  }
};

/**
 * Filter notifications by criteria
 */
export const filterNotifications = (
  notifications: Notification[],
  filterType: string
): Notification[] => {
  return notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.read;
    if (filterType === 'urgent') return notification.urgent;
    return notification.type === filterType;
  });
};

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: true,
  email: false,
  sms: false,
  types: {
    appointment: true,
    medical: true,
    patient: true,
    system: true,
    payment: true,
    security: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};
