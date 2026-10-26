import { useCallback, useEffect, useState } from 'react';
import { SCROLL_THRESHOLD } from './constants';
import type { HeaderState } from './types';

export const useHeaderState = () => {
  const [state, setState] = useState<HeaderState>({
    mobileMenuAnchorEl: null,
    scrolled: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      setState((prev) => (prev.scrolled === scrolled ? prev : { ...prev, scrolled }));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setState((prev) => ({ ...prev, mobileMenuAnchorEl: event.currentTarget }));
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setState((prev) => ({ ...prev, mobileMenuAnchorEl: null }));
  }, []);

  return { ...state, handleMobileMenuOpen, handleMobileMenuClose };
};
