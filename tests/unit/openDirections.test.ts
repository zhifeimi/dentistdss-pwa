import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDirections } from '../../src/utils/mapUtils';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=-34.5,150.8';

describe('openDirections', () => {
  const originalLocation = window.location;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  const stubLocation = () => {
    const location = { href: 'https://dentist.zhifei.org/find-a-clinic' };
    Object.defineProperty(window, 'location', { configurable: true, value: location });
    return location;
  };

  it('opens a new tab and leaves the current tab where it is', () => {
    const location = stubLocation();
    const tab = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(tab);

    openDirections({ latitude: -34.5, longitude: 150.8, name: 'Clinic' });

    expect(open).toHaveBeenCalledWith(MAPS_URL, '_blank');
    expect(tab.opener).toBeNull();
    expect(location.href).toBe('https://dentist.zhifei.org/find-a-clinic');
  });

  it('falls back to this tab only when the popup is blocked', () => {
    const location = stubLocation();
    vi.spyOn(window, 'open').mockReturnValue(null);

    openDirections({ latitude: -34.5, longitude: 150.8 });

    expect(location.href).toBe(MAPS_URL);
  });
});
