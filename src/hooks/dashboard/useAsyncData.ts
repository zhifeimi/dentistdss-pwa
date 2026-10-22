import { useState, useEffect, useCallback, DependencyList } from 'react';

interface UseAsyncDataOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

interface UseAsyncDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  refresh: () => Promise<T>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Custom hook for managing async data fetching with loading and error states
 * Provides a consistent pattern for data fetching across dashboard components
 */
export const useAsyncData = <T = any>(
  fetchFunction: (...args: any[]) => Promise<T>,
  dependencies: DependencyList = [],
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> => {
  const {
    initialData = null,
    onSuccess = null,
    onError = null,
    immediate = true,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Execute the fetch function
  const execute = useCallback(async (...args: any[]): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction(...args);
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err: any) {
      console.error('Data fetch error:', err);
      setError(err.message || 'An error occurred while fetching data');

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, onSuccess, onError]);

  // Refresh function
  const refresh = useCallback((): Promise<T> => {
    return execute();
  }, [execute]);

  // Reset function
  const reset = useCallback((): void => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  // Auto-execute on mount and dependency changes
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    execute,
    refresh,
    reset,
    setData,
  };
};
