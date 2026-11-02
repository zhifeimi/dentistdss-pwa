import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RouteSeo } from '../../src/seo/Seo';
import NotFound from '../../src/pages/NotFound';

vi.unmock('react-router');
vi.mock('../../src/context/auth', () => ({ useAuth: () => ({ isAuthenticated: false }) }));

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');
const description = () =>
  document.head.querySelector('meta[name="description"]')?.getAttribute('content');

// Testing Library unmounts after each test, and React removes the tags it
// hoisted into <head>, so each test starts with a clean head.
describe('page metadata', () => {
  it('puts the registry title, description and canonical for the route in <head>', () => {
    render(
      <MemoryRouter initialEntries={['/find-a-clinic?q=parramatta']}>
        <RouteSeo />
      </MemoryRouter>,
    );

    expect(document.title).toBe('Dentists Near You – Compare & Book Online | DentistDSS');
    expect(description()).toMatch(/^Find a dentist near you\./);
    expect(canonical()).toBe('https://dentist.zhifei.org/find-a-clinic');
    expect(robots()).toBeUndefined();
  });

  it('marks account screens noindex', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <RouteSeo />
      </MemoryRouter>,
    );

    expect(robots()).toBe('noindex, follow');
    expect(canonical()).toBeUndefined();
  });

  it('renders a noindex Not Found page with ways back into the site', () => {
    render(
      <MemoryRouter initialEntries={['/no-such-page']}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: "We can't find that page" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find a clinic' })).toHaveAttribute('href', '/find-a-clinic');
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Page Not Found | DentistDSS');
    expect(robots()).toBe('noindex, follow');
  });
});
