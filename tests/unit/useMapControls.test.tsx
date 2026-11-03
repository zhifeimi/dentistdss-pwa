import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMapControls } from '../../src/hooks/useMapControls';

describe('useMapControls', () => {
  it('opens the panel for a clinic without coordinates so "Location not available" shows', () => {
    const { result } = renderHook(() => useMapControls());

    act(() => result.current.handleClinicSelect({ id: 1, name: 'No Geo Clinic' } as never));

    expect(result.current.selectedClinic?.id).toBe(1);
    expect(result.current.infoWindowOpen).toBe(true);
  });
});
