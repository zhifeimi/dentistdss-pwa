import React, { useEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { expect, it, vi } from 'vitest';
import { AppContent } from '../../src/App';
import { startAnalytics, trackEvent } from '../../src/analytics';

vi.unmock('react-router');
vi.unmock('@mui/material/styles');
vi.mock('@mui/material', () => ({ CssBaseline: () => null }));
vi.mock('../../src/components/AppShell', () => ({ default: ({ children }) => children }));
vi.mock('../../src/components/GlobalSnackbar', () => ({ default: () => null }));
vi.mock('../../src/components/NotificationSystem', () => ({ NotificationProvider: ({ children }) => children }));
vi.mock('../../src/routes', () => ({
  default: () => {
    const { pathname } = useLocation();
    return pathname === '/appointments' ? <BookingConversion /> : null;
  },
}));

// Represents a destination that records a conversion in its mount effect.
function BookingConversion() {
  useEffect(() => trackEvent('Booking started', { fromClinicLink: true }), []);
  return null;
}

it('updates the SDK page path before a destination mount effect records a conversion', () => {
  const commands = vi.fn();
  window.va = commands;
  startAnalytics(true);
  const { result } = renderHook(() => useNavigate(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/learn']}>
        <AppContent darkMode={false} toggleDarkMode={() => {}} logout={() => {}} />
        {children}
      </MemoryRouter>
    ),
  });
  commands.mockClear();

  act(() => result.current('/appointments?book=clinic'));

  expect(commands.mock.calls).toMatchObject([
    ['pageview', { path: '/appointments' }],
    ['event', { name: 'Booking started', data: { fromClinicLink: true } }],
  ]);
});
