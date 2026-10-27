import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import TermsAndConditions from '../../src/pages/TermsAndConditions';

vi.unmock('react-router');

const Location = () => {
  const { pathname, search, hash } = useLocation();
  return <output data-testid="location">{pathname}{search}{hash}</output>;
};

const renderTerms = (entry = '/terms') => {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Location />
      <Routes>
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<p>Privacy route</p>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('Terms and Conditions', () => {
  it('renders separate terms without an effective date', () => {
    renderTerms();

    const terms = screen.getByRole('main');
    expect(screen.getByRole('heading', { level: 1, name: /terms and conditions/i })).toBeVisible();
    for (const name of ['Your responsibilities', 'Changes to these terms']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeVisible();
    }
    expect(screen.queryByText(/^effective date\s*:/i)).not.toBeInTheDocument();
    expect(terms).toHaveTextContent(/your responsibilities/i);
    expect(terms).not.toHaveTextContent('HIPAA- and GDPR-compliant');
    expect(screen.queryByRole('heading', { name: 'DentistDSS Privacy Policy' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'dentistdss@gmail.com' }))
      .toHaveAttribute('href', 'mailto:dentistdss@gmail.com');
  });

  it.each(['data-we-collect', 'google-user-data-heading', 'storage-retention', 'contact-heading'])(
    'redirects legacy privacy fragment %s without losing the query or hash',
    async (fragment) => {
      renderTerms(`/terms?source=old-link&item=7#${fragment}`);

      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent(
          `/privacy?source=old-link&item=7#${fragment}`,
        );
      });
      expect(screen.getByText('Privacy route')).toBeInTheDocument();
    },
  );

  it.each(['terms-heading', 'unknown-fragment'])(
    'keeps the %s fragment on the terms page',
    async (fragment) => {
      renderTerms(`/terms?source=link#${fragment}`);

      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent(`/terms?source=link#${fragment}`);
      });
      expect(screen.getByRole('main')).toBeInTheDocument();
    },
  );
});
