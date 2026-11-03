import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMapControls } from '../../src/hooks/useMapControls';

describe('useMapControls', () => {
  it('preserves the selected clinic viewport when the deferred map loads later', () => {
    const { result } = renderHook(() => useMapControls());
    const clinic = { id: 1, name: 'Melbourne Dental', latitude: -37.8136, longitude: 144.9631 };

    act(() => result.current.handleClinicSelect(clinic));
    const map = { panTo: vi.fn(), addListener: vi.fn() };
    act(() => result.current.onMapLoad(map as never));

    expect(result.current.mapCenter).toEqual({ lat: -37.8136, lng: 144.9631 });
    expect(result.current.mapZoom).toBe(15);
    expect(result.current.selectedClinic).toEqual(clinic);
    expect(result.current.infoWindowOpen).toBe(true);
  });

  it('opens the panel for a clinic without coordinates so "Location not available" shows', () => {
    const { result } = renderHook(() => useMapControls());

    act(() => result.current.handleClinicSelect({ id: 1, name: 'No Geo Clinic' } as never));

    expect(result.current.selectedClinic?.id).toBe(1);
    expect(result.current.infoWindowOpen).toBe(true);
  });
});
