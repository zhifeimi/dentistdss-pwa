import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ search: vi.fn(), track: vi.fn() }));
vi.mock('../../src/services', () => ({ default: { clinic: { searchClinics: mocks.search } } }));
vi.mock('../../src/analytics', () => ({ trackEvent: mocks.track }));

import { useClinicSearch } from '../../src/hooks/useClinicSearch';

const clinics = [{ id: 1, name: 'Sydney Dental' }];

describe('useClinicSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.search.mockReset().mockResolvedValue(clinics);
    mocks.track.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('consumes the pending debounce when a query is submitted immediately', async () => {
    const { result } = renderHook(() => useClinicSearch());
    act(() => result.current.setSearchKeywords('Sydney'));
    await act(async () => result.current.handleSearch());

    expect(result.current.clinics).toEqual(clinics);
    expect(mocks.track).toHaveBeenCalledWith('Clinic search', { results: 1 });
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(mocks.search).toHaveBeenCalledTimes(1);
    expect(mocks.track).toHaveBeenCalledTimes(1);
  });

  it('still automatically searches each changed query after the debounce', async () => {
    const { result } = renderHook(() => useClinicSearch());
    for (const query of ['Sydney', 'Melbourne']) {
      act(() => result.current.setSearchKeywords(query));
      await act(async () => { await vi.advanceTimersByTimeAsync(800); });
      expect(mocks.search).toHaveBeenLastCalledWith(query);
      expect(result.current.clinics).toEqual(clinics);
    }
    expect(mocks.track).toHaveBeenCalledTimes(2);
  });

  it('allows an explicit retry of the same query after an initial search fails', async () => {
    mocks.search.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useClinicSearch('Sydney'));
    await act(async () => {});
    expect(result.current.failed).toBe(true);

    await act(async () => result.current.handleSearch());
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(result.current.failed).toBe(false);
    expect(result.current.clinics).toEqual(clinics);
    expect(mocks.search).toHaveBeenCalledTimes(2);
    expect(mocks.track).toHaveBeenCalledTimes(1);
  });
});
