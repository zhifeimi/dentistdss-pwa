import {
  Home as HomeIcon,
  Chat as ChatIcon,
  Quiz as QuizIcon,
  MenuBook as MenuBookIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import type { NavigationItem } from './types';

/**
 * Header constants
 * Extracted to follow Single Responsibility Principle
 */

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Home',
    path: '/',
    icon: HomeIcon,
  },
  {
    label: 'Chat',
    path: '/chat',
    icon: ChatIcon,
    requiresAuth: true,
  },
  {
    label: 'Quiz',
    path: '/quiz',
    icon: QuizIcon,
  },
  {
    label: 'Book',
    path: '/book',
    icon: MenuBookIcon,
  },
  {
    label: 'Learn',
    path: '/learn',
    icon: SchoolIcon,
  },
];

export const SCROLL_THRESHOLD = 50;

export const HEADER_STYLES = {
  darkModeBackground: '#1c1c21',
  darkModeIconColor: '#A98FFF',
  darkModeTextColor: '#f4f4f5',
  darkModeIconFilter: 'none',
  darkModeTextShadow: 'none',
} as const;
