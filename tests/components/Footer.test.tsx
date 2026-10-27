import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Footer from '../../src/components/Footer';

vi.unmock('react-router');

const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);

describe('Footer', () => {
  it('links visibly to the separate privacy policy and terms', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    const privacyLink = within(footer).getByRole('link', { name: 'Privacy Policy' });
    const termsLink = within(footer).getByRole('link', { name: /Terms (?:and|&) Conditions/i });

    expect(privacyLink).toBeVisible();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toBeVisible();
    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(within(footer).getByRole('link', { name: 'dentistdss@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:dentistdss@gmail.com',
    );
  });

  it.each(['Privacy Policy', /Terms (?:and|&) Conditions/i])('scrolls to the top when opening %s', (name) => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    renderFooter();

    const link = screen.getByRole('link', { name });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });
});
