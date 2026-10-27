import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('react-router');
vi.mock('../../src/context/auth', () => ({ useAuth: () => ({}) }));
vi.mock('../../src/components/Auth/GoogleAuthProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../src/components/Auth/GoogleSignInButton', () => ({ default: () => null }));
vi.mock('../../src/components/Home/AuthBrandPanel', () => ({ default: () => null }));

import Signup from '../../src/pages/Home/Signup';
import ClinicAdmin from '../../src/pages/Home/Signup/ClinicAdmin';
import ClinicStaff from '../../src/pages/Home/Signup/ClinicStaff';

describe('Signup legal links', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['patient', Signup],
    ['clinic admin', ClinicAdmin],
    ['clinic staff', ClinicStaff],
  ])('links to separate terms and privacy information for %s signup', (_name, Page) => {
    render(<MemoryRouter><Page /></MemoryRouter>);

    const terms = screen.getByRole('link', { name: /terms (?:and|&) conditions/i });
    const privacy = screen.getByRole('link', { name: /privacy policy/i });
    expect(terms).toBeVisible();
    expect(terms).toHaveAttribute('href', '/terms');
    expect(privacy).toBeVisible();
    expect(privacy).toHaveAttribute('href', '/privacy');

    const disclosure = terms.closest('p')?.textContent ?? '';
    expect(disclosure).toMatch(/agree to (?:our |the )?terms/i);
    expect(disclosure).not.toMatch(/agree to (?:our |the )?privacy policy/i);
    expect(disclosure).not.toMatch(/agree to (?:our |the )?terms\s*(?:&|and)\s*conditions\s*(?:,?\s*and|&|,)\s*(?:our |the )?privacy policy/i);
    expect(privacy.closest('p')).toHaveTextContent(/(?:read|review|see|information).*privacy policy/i);
  });
});
