import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Footer from '../../src/components/Footer';

describe('Footer', () => {
  it('links visibly to the canonical privacy policy path', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    const privacyLink = within(footer).getByRole('link', { name: 'Privacy Policy' });

    expect(privacyLink).toBeVisible();
    expect(privacyLink).toHaveAttribute('href', '/terms');
    expect(within(footer).getByRole('link', { name: 'dentistdss@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:dentistdss@gmail.com',
    );
  });

  it('scrolls to the top when opening the privacy policy', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(<Footer />);

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    privacyLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(privacyLink);

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });
});
