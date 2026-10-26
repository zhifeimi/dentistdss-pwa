import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import api from '../services';
import type { ClinicSearchResult } from '../types/api';

interface UseClinicSearchReturn {
  searchKeywords: string;
  clinics: ClinicSearchResult[];
  loading: boolean;
  /** The last search request failed (not the same as no matches) */
  failed: boolean;
  isOnline: boolean;
  setSearchKeywords: (keywords: string) => void;
  handleSearch: () => void;
  handleKeyPress: (event: React.KeyboardEvent) => void;
  clearResults: () => void;
  resetSearch: () => void;
  hasResults: boolean;
  isEmpty: boolean;
}

/**
 * Custom hook for online/offline status detection using useSyncExternalStore
 * Provides more reliable network status detection than navigator.onLine
 */
const useOnlineStatus = (): boolean => {
  const subscribe = useCallback((callback: () => void): (() => void) => {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
      window.removeEventListener('online', callback);
      window.removeEventListener('offline', callback);
    };
  }, []);

  const getSnapshot = (): boolean => navigator.onLine;
  const getServerSnapshot = (): boolean => true; // Assume online during SSR

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

/**
 * Custom hook for clinic search functionality
 *
 * Features:
 * - Debounced search with 800ms delay
 * - Automatic search on keyword changes
 * - Manual search trigger
 * - Loading state management
 * - Online/offline status awareness
 * - Keyboard event handling
 * - Global error handling integration
 */
export const useClinicSearch = (initialKeywords = ''): UseClinicSearchReturn => {
  // State management. An initial query (e.g. from the home page search)
  // starts searching on mount without waiting for the debounce.
  const [searchKeywords, setSearchKeywords] = useState<string>(initialKeywords);
  const [debouncedSearchKeywords, setDebouncedSearchKeywords] = useState<string>(initialKeywords);
  const [clinics, setClinics] = useState<ClinicSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  // Network status detection
  const isOnline = useOnlineStatus();

  /**
   * Perform clinic search API call
   */
  const performSearch = useCallback(async (keywords: string): Promise<void> => {
    setFailed(false);
    if (!keywords.trim()) {
      setLoading(false);
      setClinics([]);
      return;
    }

    setLoading(true);

    try {
      const response = await api.clinic.searchClinics(keywords);

      // Handle response - it should be an array after response interceptor processing
      if (Array.isArray(response)) {
        setClinics(response);
      } else if (response === null || response === undefined) {
        setClinics([]);
      } else {
        setClinics([]);
      }
    } catch {
      // The API layer already reports the error; the list shows it with a retry
      setClinics([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search keywords
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeywords(searchKeywords);
    }, 800); // 800ms delay for optimal UX

    return () => clearTimeout(timer);
  }, [searchKeywords]);

  // Auto-search when debounced keywords change
  useEffect(() => {
    if (debouncedSearchKeywords.trim()) {
      performSearch(debouncedSearchKeywords);
    } else if (debouncedSearchKeywords === '') {
      // Clear results when search is empty
      setClinics([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchKeywords]); // Remove performSearch from dependencies to prevent infinite loop

  /**
   * Handle manual search button click
   */
  const handleSearch = useCallback(() => {
    if (!searchKeywords.trim()) {
      return;
    }

    // Trigger immediate search
    performSearch(searchKeywords);
  }, [searchKeywords, performSearch]);

  /**
   * Handle keyboard events for search input
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  /**
   * Clear search results and reset state
   */
  const clearResults = useCallback(() => {
    setClinics([]);
    setFailed(false);
    setDebouncedSearchKeywords('');
  }, []);

  /**
   * Reset all search state
   */
  const resetSearch = useCallback(() => {
    setSearchKeywords('');
    setDebouncedSearchKeywords('');
    setClinics([]);
    setFailed(false);
    setLoading(false);
  }, []);

  return {
    // State
    searchKeywords,
    clinics,
    loading,
    failed,
    isOnline,

    // Actions
    setSearchKeywords,
    handleSearch,
    handleKeyPress,
    clearResults,
    resetSearch,

    // Computed values
    hasResults: clinics.length > 0,
    isEmpty: !loading && !failed && clinics.length === 0 && searchKeywords.trim() !== '',
  };
};
