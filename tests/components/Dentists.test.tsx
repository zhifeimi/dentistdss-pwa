import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Dentists from '../../src/pages/Dentists';
import { buildDirectory } from '../../src/directory/model';
import { DirectoryPageContext } from '../../src/directory/useDirectoryPage';
import { validateDirectory } from '../../src/directory/validate';

vi.unmock('react-router');
vi.mock('../../src/context/auth', () => ({ useAuth: () => ({ isAuthenticated: false }) }));

const { directory } = validateDirectory(
  JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/public-clinics.json'), 'utf8')),
);
const index = buildDirectory(directory);

/** Renders a page the way the build does: its data comes from the prerender context. */
const renderPage = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DirectoryPageContext.Provider value={index.byPath.get(path) ?? null}>
        <Dentists />
      </DirectoryPageContext.Provider>
    </MemoryRouter>,
  );

describe('clinic directory pages', () => {
  it('shows a clinic with hours, contact details and online booking', () => {
    renderPage('/dentists/nsw/north-sydney/harbourside-dental-north-sydney');

    expect(screen.getByRole('heading', { level: 1, name: 'Harbourside Dental' })).toBeInTheDocument();
    expect(screen.getByText('Dentist in North Sydney, NSW')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book online' }))
      .toHaveAttribute('href', '/appointments?book=harbourside-dental-north-sydney');
    expect(screen.getByRole('link', { name: '+61 2 9000 0001' })).toHaveAttribute('href', 'tel:+61290000001');
    expect(screen.getByRole('link', { name: 'harbourside.example' }))
      .toHaveAttribute('rel', 'nofollow noopener noreferrer');

    const hours = screen.getByRole('table');
    const rows = within(hours).getAllByRole('row').map((row) => row.textContent);
    expect(rows[0]).toBe('Monday08:00 – 17:30');
    expect(rows.at(-1)).toBe('SundayClosed');
    expect(screen.getByRole('heading', { name: 'Other dentists in North Sydney' })).toBeInTheDocument();
    expect(document.title).toBe('Harbourside Dental – Dentist in North Sydney NSW');
  });

  it('shows a sparse clinic honestly and keeps it out of search', () => {
    renderPage('/dentists/vic/fitzroy/fitzroy-dental-fitzroy');

    expect(screen.getByRole('heading', { level: 1, name: 'Fitzroy Dental' })).toBeInTheDocument();
    expect(screen.getByText("The clinic hasn't listed its hours. Call to check.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Call to book' })).toHaveAttribute('href', 'tel:+61390000003');
    expect(screen.queryByRole('link', { name: 'Book online' })).not.toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  });

  it('lists the clinics in a suburb with links to their pages', () => {
    renderPage('/dentists/nsw/north-sydney');

    expect(screen.getByRole('heading', { level: 1, name: 'Dentists in North Sydney, NSW' })).toBeInTheDocument();
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links).toEqual(expect.arrayContaining([
      '/dentists/nsw/north-sydney/berry-street-dental-north-sydney',
      '/dentists/nsw/north-sydney/harbourside-dental-north-sydney',
      '/dentists/nsw/north-sydney/miller-street-smiles-north-sydney',
    ]));
  });

  it('says so when no clinics are listed yet', () => {
    const empty = buildDirectory({ generatedAt: 'x', clinics: [] });
    render(
      <MemoryRouter initialEntries={['/dentists']}>
        <DirectoryPageContext.Provider value={empty.byPath.get('/dentists')!}>
          <Dentists />
        </DirectoryPageContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/No clinics are listed yet/)).toBeInTheDocument();
  });
});
