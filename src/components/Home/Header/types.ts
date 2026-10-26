export interface User {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  photoURL?: string;
  profilePicture?: string;
}

export interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isMobile?: boolean;
}

export interface NavigationItem {
  label: string;
  path: string;
}

export interface HeaderState {
  mobileMenuAnchorEl: HTMLElement | null;
  scrolled: boolean;
}
