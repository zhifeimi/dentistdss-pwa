import type { NavigationItem } from './types';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Find a clinic', path: '/find-a-clinic' },
  { label: 'Learn', path: '/learn' },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Reading list', path: '/book' },
  { label: 'For clinics', path: '/#for-clinics' },
];

export const SCROLL_THRESHOLD = 8;
